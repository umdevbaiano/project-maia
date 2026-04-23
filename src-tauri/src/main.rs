// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Here you can add logic to check if the sidecar is running
            // or perform other setup tasks.
            let _window = app.get_window("main").unwrap();
            
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                _window.open_devtools();
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
