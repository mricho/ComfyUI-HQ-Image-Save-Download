import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

app.registerExtension({
    name: "Comfy.LocalSave",
    async setup() {
        // Helper to download file via HTTP (works for any file size)
        async function downloadViaHttp(filename, subfolder, type, format) {
            const params = new URLSearchParams({
                filename: filename,
                subfolder: subfolder || "",
                type: type || "output"
            });

            const response = await fetch(`/view?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = filename;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(downloadLink.href);
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
            try {
                const { images } = detail;

                for (const imageData of images) {
                    const { filename, subfolder, type, data, format } = imageData;

                    // Use HTTP download if no base64 data provided (for large files)
                    if (!data) {
                        await downloadViaHttp(filename, subfolder, type, format);
                    } else {
                        // Legacy: Base64 decode for backward compatibility
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
                app.ui.dialog.show("Save Error", `Error downloading images: ${error.message}`);
            }
        });

        // エラーメッセージのハンドラー
        api.addEventListener("local_save_error", ({ detail }) => {
            app.ui.dialog.show("Save Error", detail.message);
        });
    }
});