use anyhow::Result;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper_util::rt::TokioIo;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tracing::{info, error};

mod proxy;
mod engine;
mod wazuh;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    info!("Starting Vetta Shield DLP Proxy...");

    // Porta proxy local 
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    let listener = TcpListener::bind(addr).await?;

    info!("Listening on http://{}", addr);

    loop {
        let (stream, peer_addr) = listener.accept().await?;
        
        let io = TokioIo::new(stream);

        tokio::task::spawn(async move {
            info!("Conexão aceita de: {}", peer_addr);
            
            // Tratamento da requisicao passara por proxy::handle_request
            if let Err(err) = http1::Builder::new()
                .preserve_header_case(true)
                .title_case_headers(true)
                .serve_connection(io, service_fn(proxy::handle_request))
                .with_upgrades() // Suporte para CONNECT e TLS tunneling
                .await
            {
                error!("Falha ao servir conexão: {:?}", err);
            }
        });
    }
}
