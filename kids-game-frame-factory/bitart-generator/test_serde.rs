use serde_json;

fn main() {
    let v = serde_json::json!({"prompt": "奥特曼"});
    let bytes = serde_json::to_vec(&v).unwrap();
    println!("Bytes: {:?}", bytes);
    let s = String::from_utf8(bytes).unwrap();
    println!("String: {}", s);
}
