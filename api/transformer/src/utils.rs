use std::str::FromStr;

use anyhow::Result;
use thiserror::Error;

use diem_api_types::HexEncodedBytes;

#[derive(Error, Debug)]
pub enum UtilsError {
    #[error("invalid hex value")]
    InvalidHexValue,
}

pub fn parse_addr(input: &str) -> Result<HexEncodedBytes> {
    let mut addr = input.to_string();
    addr = addr
        .strip_prefix("0x")
        .ok_or(UtilsError::InvalidHexValue)?
        .to_string();
    if addr.len() < 32 {
        addr = format!("{:0>32}", addr);
    } else {
        addr = format!("{:0>64}", addr);
    }
    return Ok(HexEncodedBytes::from_str(&addr).unwrap());
}

// pub fn parse_hex(input: &str) -> Result<HexEncodedBytes> {
//     let mut addr = input.to_string();
//     addr = addr.strip_prefix("0x").ok_or(UtilsError::InvalidHexValue)?.to_string();
//     if addr.len() % 1 == 1 {
//         addr = format!("0{addr}");
//     }
//     return Ok(HexEncodedBytes::from_str(&addr).unwrap());
// }
