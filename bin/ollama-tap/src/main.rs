use anyhow::Result;
use bytes::Bytes;
use clap::Parser;
use http::Uri;
use http_body_util::{BodyExt, Full};
use hyper::body::Incoming;
use hyper::service::service_fn;
use hyper::{Request, Response};
use hyper_util::client::legacy::Client;
use hyper_util::rt::{TokioExecutor, TokioIo};
use std::net::SocketAddr;
use std::time::Instant;
use tokio::net::TcpListener;

#[derive(Parser, Debug)]
#[command(name = "ollama-tap")]
#[command(about = "HTTP sidecar logger for Ollama")]
struct Args {
    /// listen address
    #[arg(short, long, default_value = "127.0.0.1:11435")]
    listen: SocketAddr,

    /// upstream base url
    #[arg(short, long, default_value = "http://127.0.0.1:11434")]
    upstream: Uri,
}

#[tokio::main]
async fn main() -> Result<()> {
    let Args { listen, upstream } = Args::parse();

    println!("🚀 listen   = {}", listen);
    println!("🎯 upstream = {}", upstream);

    let listener = TcpListener::bind(listen).await?;

    let client: Client<_, Full<Bytes>> = Client::builder(TokioExecutor::new()).build_http();

    loop {
        let (stream, _) = listener.accept().await?;
        let io = TokioIo::new(stream);

        let client = client.clone();
        let upstream = upstream.clone();

        tokio::spawn(async move {
            let service = service_fn(move |req| {
                let client = client.clone();
                let upstream = upstream.clone();

                async move { proxy(upstream, req, client).await }
            });

            hyper_util::server::conn::auto::Builder::new(TokioExecutor::new())
                .serve_connection(io, service)
                .await
                .unwrap();
        });
    }
}

async fn proxy(
    upstream: Uri,
    req: Request<Incoming>,
    client: Client<hyper_util::client::legacy::connect::HttpConnector, Full<Bytes>>,
) -> Result<Response<Full<Bytes>>> {
    let start = Instant::now();

    let uri = join_uri(&upstream, req.uri());
    let method = req.method().clone();
    println!("\n================ REQUEST ================");
    println!("{} {}", method, uri);

    let body = req.collect().await?.to_bytes();
    log_json("REQ", &body);

    let new_req = Request::builder()
        .method(method)
        .uri(uri)
        .body(Full::new(body.clone()))
        .unwrap();

    let resp = client.request(new_req).await?;

    let status = resp.status();
    let resp_body = resp.collect().await?.to_bytes();

    println!("================ RESPONSE ================");
    println!("status = {}", status);
    log_json("RESP", &resp_body);

    println!("latency = {} ms", start.elapsed().as_millis());

    Ok(Response::builder()
        .status(status)
        .body(Full::new(resp_body))
        .unwrap())
}

fn join_uri(base: &Uri, path: &Uri) -> Uri {
    let mut parts = base.clone().into_parts();
    parts.path_and_query = path.path_and_query().cloned();
    Uri::from_parts(parts).unwrap()
}

fn log_json(tag: &str, body: &[u8]) {
    if body.is_empty() {
        return;
    }

    let text = String::from_utf8_lossy(body);

    for line in text.lines() {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(line) {
            println!("{}: {}", tag, serde_json::to_string_pretty(&v).unwrap());
        } else {
            println!("{}: {}", tag, line);
        }
    }
}
