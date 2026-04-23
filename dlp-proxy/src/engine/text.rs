use regex::Regex;

pub struct Masker {
    cpf_regex: Regex,
}

impl Masker {
    pub fn new() -> Self {
        Masker {
            cpf_regex: Regex::new(r"\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11}").unwrap(),
        }
    }

    pub fn apply_mask(&self, input: &str) -> String {
        self.cpf_regex.replace_all(input, "[CPF_MASCARADO]").to_string()
    }
}
