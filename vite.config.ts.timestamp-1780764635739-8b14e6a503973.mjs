// vite.config.ts
import { defineConfig } from "file:///app/data/%E6%89%80%E6%9C%89%E5%AF%B9%E8%AF%9D/%E4%B8%BB%E5%AF%B9%E8%AF%9D/shopify-ai-lister/node_modules/vite/dist/node/index.js";
import { vitePlugin as remix } from "file:///app/data/%E6%89%80%E6%9C%89%E5%AF%B9%E8%AF%9D/%E4%B8%BB%E5%AF%B9%E8%AF%9D/shopify-ai-lister/node_modules/@remix-run/dev/dist/index.js";
import { vercelPreset } from "file:///app/data/%E6%89%80%E6%9C%89%E5%AF%B9%E8%AF%9D/%E4%B8%BB%E5%AF%B9%E8%AF%9D/shopify-ai-lister/node_modules/@vercel/remix/vite.js";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///app/data/%E6%89%80%E6%9C%89%E5%AF%B9%E8%AF%9D/%E4%B8%BB%E5%AF%B9%E8%AF%9D/shopify-ai-lister/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      presets: [vercelPreset()],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true
      }
    })
  ],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", __vite_injected_original_import_meta_url))
    }
  },
  server: { port: 3e3 }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2RhdGEvXHU2MjQwXHU2NzA5XHU1QkY5XHU4QkREL1x1NEUzQlx1NUJGOVx1OEJERC9zaG9waWZ5LWFpLWxpc3RlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2FwcC9kYXRhL1x1NjI0MFx1NjcwOVx1NUJGOVx1OEJERC9cdTRFM0JcdTVCRjlcdThCREQvc2hvcGlmeS1haS1saXN0ZXIvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2FwcC9kYXRhLyVFNiU4OSU4MCVFNiU5QyU4OSVFNSVBRiVCOSVFOCVBRiU5RC8lRTQlQjglQkIlRTUlQUYlQjklRTglQUYlOUQvc2hvcGlmeS1haS1saXN0ZXIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IHZpdGVQbHVnaW4gYXMgcmVtaXggfSBmcm9tICdAcmVtaXgtcnVuL2Rldic7XG5pbXBvcnQgeyB2ZXJjZWxQcmVzZXQgfSBmcm9tICdAdmVyY2VsL3JlbWl4L3ZpdGUnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVtaXgoe1xuICAgICAgaWdub3JlZFJvdXRlRmlsZXM6IFsnKiovLionXSxcbiAgICAgIHByZXNldHM6IFt2ZXJjZWxQcmVzZXQoKV0sXG4gICAgICBmdXR1cmU6IHtcbiAgICAgICAgdjNfZmV0Y2hlclBlcnNpc3Q6IHRydWUsXG4gICAgICAgIHYzX3JlbGF0aXZlU3BsYXRQYXRoOiB0cnVlLFxuICAgICAgICB2M190aHJvd0Fib3J0UmVhc29uOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnfic6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9hcHAnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHsgcG9ydDogMzAwMCB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNWLFNBQVMsb0JBQW9CO0FBQ25YLFNBQVMsY0FBYyxhQUFhO0FBQ3BDLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsZUFBZSxXQUFXO0FBSDZJLElBQU0sMkNBQTJDO0FBS2pPLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxNQUNKLG1CQUFtQixDQUFDLE9BQU87QUFBQSxNQUMzQixTQUFTLENBQUMsYUFBYSxDQUFDO0FBQUEsTUFDeEIsUUFBUTtBQUFBLFFBQ04sbUJBQW1CO0FBQUEsUUFDbkIsc0JBQXNCO0FBQUEsUUFDdEIscUJBQXFCO0FBQUEsTUFDdkI7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUSxFQUFFLE1BQU0sSUFBSztBQUN2QixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
