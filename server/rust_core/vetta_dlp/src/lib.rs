use pyo3::prelude::*;
use aho_corasick::AhoCorasick;
use regex::Regex;
use std::sync::OnceLock;

static CPF_REGEX: OnceLock<Regex> = OnceLock::new();
static CNPJ_REGEX: OnceLock<Regex> = OnceLock::new();

/// Função ultrarrápida exposta para o Python que blinda documentos processuais 
/// antes deles serem jogados para as APIs of LLM ou Indexadores.
#[pyfunction]
fn sanitize_document(text: String) -> PyResult<String> {
    // 1. Busca por Padrões Governamentais Críticos (CPF/CNPJ) via Regex pré-compilado
    let cpf_re = CPF_REGEX.get_or_init(|| {
        Regex::new(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b").unwrap()
    });
    
    let cnpj_re = CNPJ_REGEX.get_or_init(|| {
        Regex::new(r"\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b").unwrap()
    });

    // Mascara CPFs
    let mut sanitized = cpf_re.replace_all(&text, "[CPF_REMOVIDO]").to_string();
    
    // Mascara CNPJs
    sanitized = cnpj_re.replace_all(&sanitized, "[CNPJ_REMOVIDO]").to_string();

    // 2. Filtragem de Expressões com Aho-Corasick (Ex: Nomes de Varas, Juízes que vazariam Comarca)
    // Custo no Python: O(n); Custo no Rust AC: O(n) extremamente denso na memória e vetorizado.
    let patterns = &["Vara Criminal", "Vara de Violência Doméstica", "Alexandre de Moraes"];
    let replace_with = &["[VARA_CRIMINAL_OMITIDA]", "[VARA_OMITIDA]", "[MAGISTRADO_SUPREMO_OMITIDO]"];
    
    let ac = AhoCorasick::new(patterns).unwrap();
    let final_text = ac.replace_all(&sanitized, replace_with);

    Ok(final_text)
}

/// Define the Python Module binding. This name must match the shared library.
#[pymodule]
fn vetta_dlp(_py: Python<'_>, m: &PyModule) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(sanitize_document, m)?)?;
    Ok(())
}
