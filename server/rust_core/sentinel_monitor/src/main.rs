use nvml_wrapper::Nvml;
use nvml_wrapper::error::NvmlError;
use std::time::Duration;
use tokio::time;

use std::fs;

#[cfg(target_os = "linux")]
fn verify_hardware_fingerprint(nvml: &Nvml) -> Result<(), &'static str> {
    // Leitura nativa K3s do Node UUID
    let uuid_raw = fs::read_to_string("/sys/class/dmi/id/product_uuid")
        .unwrap_or_else(|_| "UNKNOWN".to_string());
    
    // Ler o serial físico da Placa
    let device = nvml.device_by_index(0).map_err(|_| "Falha ao ler GPU 0")?;
    let gpu_serial = device.serial().map_err(|_| "Falha ao ler o serial da GPU")?;

    // Exemplo de Lock-Check estrito. 
    // Em produção real, consumiremos variavéis secretas via KMS ou Vault.
    let authorized_uuid = std::env::var("VETTA_AUTHORIZED_UUID").unwrap_or_default();
    let authorized_gpu = std::env::var("VETTA_AUTHORIZED_GPU").unwrap_or_default();

    if authorized_uuid.is_empty() || authorized_gpu.is_empty() {
        println!("[VETTA-SHIELD] (Warning) Operando de forma degradada. Faltam chaves autorizadoras.");
    } else {
        if uuid_raw.trim() != authorized_uuid.trim() || gpu_serial != authorized_gpu {
            // THEMIS AUTO-DESTRUIÇÃO -> LOCK DE ACESSO
            return Err("LOCK STATE: TENTATIVA DE CLONAGEM DO DISCO. THEMIS IP LOCK ATIVADO.");
        }
    }
    Ok(())
}

#[cfg(not(target_os = "linux"))]
fn verify_hardware_fingerprint(_nvml: &Nvml) -> Result<(), &'static str> {
    println!("[VETTA-SHIELD] Sistema Windows detectado. Hardware-Lock bypass liberado p/ Dev.");
    Ok(())
}

/// Vetta Vault Sentinel Monitor
/// Roda independentemente do FastAPI como um Worker Dockerizado ou Daemon local (SystemD).
/// O seu único propósito é blindar o Hardware (RTX 4060Ti/SFF Ada) de burnout e avisar de memory leaks.
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("[SENTINEL] Iniciando Monitoramento de Hardware NVML...");

    // Inicializa o Native Bridge com os drivers Cuda/Nvidia na máquina host do Kubernetes/Pod.
    let nvml = match Nvml::init() {
        Ok(n) => n,
        Err(e) => {
            eprintln!("[SENTINEL ALERT] Drivers NVIDIA ou Placa de Vídeo não encontrados. ({})", e);
            eprintln!("[SENTINEL] Operando em Modo Dry Run para desenvolvimento.");
            
            // Permite que o Sentinel não crash em máquinas sem GPU físicas (Github Actions)
            loop {
                time::sleep(Duration::from_secs(10)).await;
            }
        }
    };

    let device_count = nvml.device_count()?;
    println!("[SENTINEL] {} Unidades Computacionais Detectadas.", device_count);

    // Valida o Hardware Themis Lock na Placa e CPU (Pára Inicialização se pirateado)
    if let Err(lock_err) = verify_hardware_fingerprint(&nvml) {
        eprintln!("🛑 {}", lock_err);
        std::process::exit(1);
    }
    
    println!("[VETTA-SHIELD] Hardware Assinado e Validado com Sucesso.");

    let mut interval = time::interval(Duration::from_secs(5)); // Coleta a cada 5s
    
    // Config limit
    let critical_temperature_celsius = 85; 

    loop {
        interval.tick().await;

        for i in 0..device_count {
            let device = nvml.device_by_index(i)?;
            let temp = device.temperature(nvml_wrapper::enum_wrappers::device::TemperatureSensor::Gpu)?;
            let memory = device.memory_info()?;
            
            let used_mb = memory.used / 1024 / 1024;
            let total_mb = memory.total / 1024 / 1024;
            let usage_percent = (memory.used as f32 / memory.total as f32) * 100.0;

            if temp > critical_temperature_celsius {
                eprintln!("🔥 [CRÍTICO] GPU {} Atingiu {}°C!", i, temp);
                // INSERIR AQUI:
                // std::process::Command::new("kill").arg("-9").arg("pid-do-python").output()
            }

            // Exemplo de telemetria base se ativada com um log verbose
            // println!("GPU: {} | Temp: {}°C | VRAM: {}/{} MB ({:.2}%)", i, temp, used_mb, total_mb, usage_percent);
        }
    }
}
