import { isPreview } from "../../lib/runtime";
export default function PreviewBanner() {
  if (!isPreview) return null;
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b-[0.5px] border-gold/20 bg-gold/10 px-5 py-2 text-sm text-noir">
      <span>
        <span className="font-medium text-gold">VENDA PREVIEW</span>
        <span className="ml-3">
          Sample data saved in this browser · no real payments or messages
        </span>
      </span>
      <div className="flex items-center gap-4">
        <a
          href="https://render.com/deploy?repo=https://github.com/panorago/Operations-Platform"
          target="_blank"
          rel="noreferrer"
          className="text-gold"
        >
          Deploy shared workspace ↗
        </a>
        <button
          aria-label="Reset preview"
          className="text-muted"
          onClick={() => {
            if (
              window.confirm(
                "Reset all preview changes and restore the sample data?",
              )
            )
              void import("../../lib/preview").then(({ resetPreview }) => {
                resetPreview();
                window.location.reload();
              });
          }}
        >
          Reset preview
        </button>
      </div>
    </div>
  );
}
