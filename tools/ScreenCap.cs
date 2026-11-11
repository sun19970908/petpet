using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

namespace LivLivPet {
    public class ScreenCap {
        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool SetProcessDpiAwarenessContext(IntPtr dpiContext);

        private static readonly IntPtr DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = new IntPtr(-4);

        [DllImport("gdi32.dll")]
        private static extern bool BitBlt(IntPtr hdcDest, int nXDest, int nYDest, int nWidth, int nHeight, IntPtr hdcSrc, int nXSrc, int nYSrc, int dwRop);

        [DllImport("user32.dll")]
        private static extern IntPtr GetDesktopWindow();

        [DllImport("user32.dll")]
        private static extern IntPtr GetWindowDC(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

        private struct RECT {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
        private struct MONITORINFOEX {
            public int cbSize;
            public RECT rcMonitor;
            public RECT rcWork;
            public uint dwFlags;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
            public string szDevice;
        }

        private delegate bool MonitorEnumProc(IntPtr hMonitor, IntPtr hdcMonitor, ref RECT lprcMonitor, IntPtr dwData);

        [DllImport("user32.dll")]
        private static extern bool EnumDisplayMonitors(IntPtr hdc, IntPtr lprcClip, MonitorEnumProc lpfnEnum, IntPtr dwData);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        private static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFOEX lpmi);

        public class MonitorData {
            public int Index;
            public string Device;
            public int X;
            public int Y;
            public int Width;
            public int Height;
            public bool IsPrimary;
        }

        private static ImageCodecInfo GetEncoder(ImageFormat format) {
            ImageCodecInfo[] codecs = ImageCodecInfo.GetImageDecoders();
            foreach (ImageCodecInfo codec in codecs) {
                if (codec.FormatID == format.Guid) {
                    return codec;
                }
            }
            return null;
        }

        public static List<MonitorData> GetMonitors() {
            List<MonitorData> list = new List<MonitorData>();
            int idx = 0;
            EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, (IntPtr hMon, IntPtr hdc, ref RECT rc, IntPtr data) => {
                MONITORINFOEX mi = new MONITORINFOEX();
                mi.cbSize = Marshal.SizeOf(typeof(MONITORINFOEX));
                if (GetMonitorInfo(hMon, ref mi)) {
                    MonitorData md = new MonitorData {
                        Index = idx++,
                        Device = mi.szDevice,
                        X = mi.rcMonitor.Left,
                        Y = mi.rcMonitor.Top,
                        Width = mi.rcMonitor.Right - mi.rcMonitor.Left,
                        Height = mi.rcMonitor.Bottom - mi.rcMonitor.Top,
                        IsPrimary = (mi.dwFlags & 1) != 0
                    };
                    list.Add(md);
                }
                return true;
            }, IntPtr.Zero);
            return list;
        }

        public static byte[] CaptureRect(int x, int y, int width, int height, long quality = 85L) {
            IntPtr hDesktop = GetDesktopWindow();
            IntPtr hdcSrc = GetWindowDC(hDesktop);

            using (Bitmap bmp = new Bitmap(width, height, PixelFormat.Format24bppRgb)) {
                using (Graphics g = Graphics.FromImage(bmp)) {
                    IntPtr hdcDest = g.GetHdc();
                    BitBlt(hdcDest, 0, 0, width, height, hdcSrc, x, y, 0x00CC0020); // SRCCOPY
                    g.ReleaseHdc(hdcDest);
                }

                using (MemoryStream ms = new MemoryStream()) {
                    ImageCodecInfo jpgEncoder = GetEncoder(ImageFormat.Jpeg);
                    EncoderParameters myEncoderParameters = new EncoderParameters(1);
                    myEncoderParameters.Param[0] = new EncoderParameter(Encoder.Quality, quality);
                    bmp.Save(ms, jpgEncoder, myEncoderParameters);
                    ReleaseDC(hDesktop, hdcSrc);
                    return ms.ToArray();
                }
            }
        }

        public static int Main(string[] args) {
            try {
                if (!SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2)) {
                    SetProcessDPIAware();
                }
            } catch {
                SetProcessDPIAware();
            }

            if (args.Length == 0 || args[0] == "list") {
                var mons = GetMonitors();
                Console.WriteLine("[");
                for (int i = 0; i < mons.Count; i++) {
                    var m = mons[i];
                    string safeDev = m.Device.Replace("\\", "\\\\");
                    Console.WriteLine("  { \"index\": " + m.Index + ", \"device\": \"" + safeDev + "\", \"x\": " + m.X + ", \"y\": " + m.Y + ", \"width\": " + m.Width + ", \"height\": " + m.Height + ", \"isPrimary\": " + (m.IsPrimary ? "true" : "false") + " }" + (i < mons.Count - 1 ? "," : ""));
                }
                Console.WriteLine("]");
                return 0;
            }

            if (args[0] == "cap") {
                if (args.Length < 3) {
                    Console.Error.WriteLine("Usage: cap <outFile> <main|room|idx|device|x,y,w,h> [quality]");
                    return 1;
                }

                string outFile = args[1];
                string target = args[2].Trim().ToLower();
                long quality = 85L;
                if (args.Length >= 4) {
                    long.TryParse(args[3], out quality);
                }

                var mons = GetMonitors();
                MonitorData chosen = null;

                if (target == "main" || target == "primary") {
                    chosen = mons.Find(m => m.IsPrimary) ?? (mons.Count > 0 ? mons[0] : null);
                } else if (target == "room" || target == "secondary") {
                    chosen = mons.Find(m => !m.IsPrimary) ?? (mons.Count > 0 ? mons[0] : null);
                } else {
                    int idx;
                    if (int.TryParse(target, out idx)) {
                        chosen = mons.Find(m => m.Index == idx);
                    } else if (target.Contains(",")) {
                        string[] parts = target.Split(',');
                        if (parts.Length == 4) {
                            int x = int.Parse(parts[0]);
                            int y = int.Parse(parts[1]);
                            int w = int.Parse(parts[2]);
                            int h = int.Parse(parts[3]);
                            byte[] raw = CaptureRect(x, y, w, h, quality);
                            File.WriteAllBytes(outFile, raw);
                            Console.WriteLine("CAPTURED: (" + x + "," + y + " " + w + "x" + h + ") " + raw.Length + " bytes");
                            return 0;
                        }
                    } else {
                        chosen = mons.Find(m => m.Device.ToLower().Contains(target));
                    }
                }

                if (chosen == null) {
                    chosen = target == "room" ? (mons.Find(m => !m.IsPrimary) ?? (mons.Count > 0 ? mons[0] : null))
                                              : (mons.Find(m => m.IsPrimary) ?? (mons.Count > 0 ? mons[0] : null));
                }

                if (chosen == null) {
                    Console.Error.WriteLine("Error: monitor not found for target: " + target);
                    return 2;
                }

                byte[] bytes = CaptureRect(chosen.X, chosen.Y, chosen.Width, chosen.Height, quality);
                File.WriteAllBytes(outFile, bytes);
                Console.WriteLine("CAPTURED: " + chosen.Device + " (" + chosen.X + "," + chosen.Y + " " + chosen.Width + "x" + chosen.Height + ") " + bytes.Length + " bytes");
                return 0;
            }

            return 0;
        }
    }
}
