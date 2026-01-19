import sys
import ctypes
from ctypes import windll, byref, c_int, Structure, c_long
import win32gui
import win32ui
import win32con

# Pre-load constants
PW_RENDERFULLCONTENT = 0x00000002
SRCCOPY = 0x00CC0020

# Define RECT structure for ctypes
class RECT(Structure):
    _fields_ = [
        ('left', c_long),
        ('top', c_long),
        ('right', c_long),
        ('bottom', c_long)
    ]

def capture_active_window(output_path: str):
    """Capture active window with optimized performance"""
    
    # Get active window handle
    hwnd = win32gui.GetForegroundWindow()
    if not hwnd:
        raise RuntimeError("No active window found")
    
    # Get window rect using ctypes (faster than win32gui)
    rect = RECT()
    if not windll.user32.GetWindowRect(hwnd, byref(rect)):
        raise RuntimeError("Failed to get window rect")
    
    width = rect.right - rect.left
    height = rect.bottom - rect.top
    
    if width <= 0 or height <= 0:
        raise RuntimeError(f"Invalid window size: {width}x{height}")
    
    # Device contexts
    hwnd_dc = win32gui.GetWindowDC(hwnd)
    mfc_dc = win32ui.CreateDCFromHandle(hwnd_dc)
    save_dc = mfc_dc.CreateCompatibleDC()
    
    # Bitmap creation
    bitmap = win32ui.CreateBitmap()
    bitmap.CreateCompatibleBitmap(mfc_dc, width, height)
    save_dc.SelectObject(bitmap)
    
    try:
        # Use PrintWindow for accurate capture
        result = windll.user32.PrintWindow(
            hwnd,
            save_dc.GetSafeHdc(),
            PW_RENDERFULLCONTENT
        )
        
        if result != 1:
            # Fallback to BitBlt if PrintWindow fails
            save_dc.BitBlt(
                (0, 0), (width, height),
                mfc_dc,
                (0, 0),
                SRCCOPY
            )
        
        # Save bitmap directly (fastest method)
        bitmap.SaveBitmapFile(save_dc, output_path)
        
    finally:
        # Cleanup in reverse order
        save_dc.DeleteDC()
        mfc_dc.DeleteDC()
        win32gui.ReleaseDC(hwnd, hwnd_dc)
        win32gui.DeleteObject(bitmap.GetHandle())


def main():
    if len(sys.argv) < 2:
        print("Usage: screenshot_agent.exe <output_path>", file=sys.stderr)
        sys.exit(1)
    
    try:
        capture_active_window(sys.argv[1])
        print(f"Screenshot saved to: {sys.argv[1]}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()