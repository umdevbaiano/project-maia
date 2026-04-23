use anyhow::Result;
use hyper::{Request, Response, body::Incoming, Method};
use hyper_util::rt::TokioIo;
use std::convert::Infallible;
use tracing::{info, warn};

// Trata requisições HTTP e método CONNECT
pub async fn handle_request(req: Request<Incoming>) -> Result<Response<String>, Infallible> {
    if Method::CONNECT == req.method() {
        // Interceptar CONNECT TLS
        info!("Recebido método CONNECT para: {:?}", req.uri());
        // A lógica do MITM TLS virá aqui
        Ok(Response::new("Tunnel established".to_string()))
    } else {
        // Interceptar HTTP limpo ou Gateway Explícito
        info!("Requisição HTTP recebida: {:?}", req.uri());
        Ok(Response::new("Vetta Shield: Requisição Bloqueada/Processada".to_string()))
    }
}
