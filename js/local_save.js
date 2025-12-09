import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

app.registerExtension({
    name: "Comfy.LocalSave",
    async setup() {
        // Helper to download file via direct link (works for any file size and with reverse proxies)
        function downloadViaHttp(filename, subfolder, type, format) {
            const params = new URLSearchParams({
                filename: filename,
                subfolder: subfolder || "",
                type: type || "output"
            });

            // Create a direct download link - don't use fetch, let browser handle it natively
            const downloadUrl = `/view?${params.toString()}`;
            const downloadLink = document.createElement("a");
            downloadLink.href = downloadUrl;
            downloadLink.download = filename;
            downloadLink.style.display = "none";

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            console.log(`[LocalSave] Triggered download for: ${filename}`);
        }

        // Legacy: Base64をBlobに変換するユーティリティ関数 (kept for backward compatibility with small files)
        function base64ToBlob(base64, mimeType) {
            const byteString = atob(base64);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            return new Blob([ab], { type: mimeType });
        }

        // 画像データ受信時のハンドラー
        api.addEventListener("local_save_data", async ({ detail }) => {
            console.log("[LocalSave] Received local_save_data event:", detail);
            try {
                const { images } = detail;
                console.log("[LocalSave] Images to download:", images);

                for (const imageData of images) {
                    const { filename, subfolder, type, data, format } = imageData;
                    console.log("[LocalSave] Processing image:", { filename, subfolder, type, hasData: !!data, format });

                    // Use HTTP download if no base64 data provided (for large files)
                    if (!data) {
                        console.log("[LocalSave] Using HTTP download for:", filename);
                        downloadViaHttp(filename, subfolder, type, format);
                    } else {
                        // Legacy: Base64 decode for backward compatibility
                        console.log("[LocalSave] Using base64 decode for:", filename);
                        const blob = base64ToBlob(data, `image/${format}`);
                        const downloadLink = document.createElement("a");
                        downloadLink.href = URL.createObjectURL(blob);
                        downloadLink.download = filename;

                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        URL.revokeObjectURL(downloadLink.href);
                    }
                }

            } catch (error) {
                console.error("[LocalSave] Error:", error);
                app.ui.dialog.show("Save Error", `Error downloading images: ${error.message}`);
            }
        });

        // エラーメッセージのハンドラー
        api.addEventListener("local_save_error", ({ detail }) => {
            app.ui.dialog.show("Save Error", detail.message);
        });
    }
});