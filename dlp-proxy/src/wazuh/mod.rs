use tracing::{info, error};

pub fn log_alert(message: &str) {
    info!("Wazuh Alert Sent: {}", message);
    // Aqui vai o código real do socket UDP/TCP pro Wazuh Syslog
}
