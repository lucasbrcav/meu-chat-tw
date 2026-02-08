use tauri::{WebviewWindow};

#[tauri::command]
fn set_always_on_top(window: WebviewWindow, enabled: bool) -> Result<(), String> {
    window
        .set_always_on_top(enabled)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_window_opacity(window: WebviewWindow, opacity: f64) -> Result<(), String> {
    // Clamp opacity between 0.3 and 1.0 for usability
    let clamped = opacity.clamp(0.3, 1.0);
    
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::WindowsAndMessaging::{SetLayeredWindowAttributes, SetWindowLongW, GetWindowLongW, GWL_EXSTYLE, WS_EX_LAYERED, LWA_ALPHA};
        
        let hwnd_ptr = window.hwnd().map_err(|e| e.to_string())?;
        let hwnd = HWND(hwnd_ptr.0 as *mut _);
        unsafe {
            let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
            SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style | WS_EX_LAYERED.0 as i32);
            let alpha = (clamped * 255.0) as u8;
            SetLayeredWindowAttributes(hwnd, None, alpha, LWA_ALPHA).ok();
        }
    }
    
    Ok(())
}

#[tauri::command]
fn set_click_through(window: WebviewWindow, enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::WindowsAndMessaging::{SetWindowLongW, GetWindowLongW, GWL_EXSTYLE, WS_EX_TRANSPARENT, WS_EX_LAYERED};
        
        let hwnd_ptr = window.hwnd().map_err(|e| e.to_string())?;
        let hwnd = HWND(hwnd_ptr.0 as *mut _);
        
        unsafe {
            let mut ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
            
            if enabled {
                // Adicionar WS_EX_TRANSPARENT e WS_EX_LAYERED para cliques passarem através
                ex_style |= WS_EX_TRANSPARENT.0 as i32;
                ex_style |= WS_EX_LAYERED.0 as i32;
            } else {
                // Remover WS_EX_TRANSPARENT para cliques normais
                ex_style &= !(WS_EX_TRANSPARENT.0 as i32);
            }
            
            SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style);
        }
    }
    
    Ok(())
}

#[tauri::command]
fn reset_window_size(window: WebviewWindow) -> Result<(), String> {
    use tauri::LogicalSize;
    window
        .set_size(LogicalSize::new(400.0, 600.0))
        .map_err(|e| e.to_string())?;
    window.center().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_window_info(window: WebviewWindow) -> Result<serde_json::Value, String> {
    let size = window.inner_size().map_err(|e| e.to_string())?;
    let position = window.outer_position().map_err(|e| e.to_string())?;
    let always_on_top = window.is_always_on_top().map_err(|e| e.to_string())?;
    
    Ok(serde_json::json!({
        "width": size.width,
        "height": size.height,
        "x": position.x,
        "y": position.y,
        "alwaysOnTop": always_on_top
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            set_always_on_top,
            set_window_opacity,
            set_click_through,
            reset_window_size,
            get_window_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
