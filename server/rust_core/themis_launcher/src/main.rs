use std::process::{Command, Stdio};
use std::env;

fn print_logo() {
    println!("=======================================================");
    println!("                THEMIS - VETTA VAULT                   ");
    println!("       Ambiente Autônomo e Protocolo Jurídico          ");
    println!("=======================================================");
}

fn check_docker() -> bool {
    println!(">> Checando subsistema Docker Edge na máquina local...");
    let status = Command::new("docker")
        .arg("--version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();

    match status {
        Ok(s) => s.success(),
        Err(_) => false,
    }
}

fn install_docker_windows() {
    println!(">> Docker Desktop ausente. Iniciando instalação assistida para Windows via Winget...");
    println!("   Por favor, autorize o prompt de administrador (UAC) se for solicitado.");
    
    let status = Command::new("winget")
        .args(["install", "Docker.DockerDesktop"])
        .status();

    if let Ok(s) = status {
        if s.success() {
            println!(">> Instalação Base finalizada. Talvez seja necessário reiniciar a máquina e abrir este Themis-Setup.exe novamente.");
        } else {
            println!("[ERRO] O gerenciador de pacotes falhou Themis-Setup.exe. Instale o Docker manualmente em: https://docs.docker.com/desktop/install/windows-install/");
        }
    }
}

fn spin_up_vault() {
    println!(">> Iniciando Instância da Vetta...");
    // Em Produção, ele fará o pull da Imagem hospedada Privada das GitHub_Actions ou Azure.
    let status = Command::new("docker-compose")
        .args(["up", "-d"])
        .status()
        .expect("Falha massiva de orquestração tentar rodar docker-compose.");

    if status.success() {
        println!(">> Ambiente Estabilizado! Abrindo interface de Controle Maia...");
        
        let url = "http://localhost:5173/app";
        #[cfg(target_os = "windows")]
        {
            Command::new("cmd").args(["/C", "start", url]).spawn().unwrap();
        }
        #[cfg(target_os = "macos")]
        {
            Command::new("open").arg(url).spawn().unwrap();
        }
        #[cfg(target_os = "linux")]
        {
            Command::new("xdg-open").arg(url).spawn().unwrap();
        }
    } else {
        println!(">> O Ambiente Vetta reportou lentidão e o arranque não respondeu perfeitamente.");
    }
}

fn main() {
    print_logo();

    let has_docker = check_docker();
    if !has_docker {
        if cfg!(target_os = "windows") {
            install_docker_windows();
        } else {
            println!("[ATENÇÂO] O Edge Vault K3s/Docker-Compose não nativo. Instale manualmente.");
            println!("Acesse: https://docs.docker.com/get-docker/");
        }
        println!("Saindo...");
        return;
    }

    println!(">> Dependência Validada. Processando o Edge Server...");
    spin_up_vault();
    
    println!(">> Setup Finalizado. O Vetta Vault se estabilizará visualmente em segundos.");
    // Impede que a tela do console de Instalação (CMD/Powershell) pisque e suma imediatamente no Windows
    println!("   Aperte Enter para fechar o assistente.");
    let mut s = String::new();
    std::io::stdin().read_line(&mut s).unwrap();
}
