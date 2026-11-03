import { isPreview } from "../../lib/runtime";
export default function PreviewBanner() {
  if (!isPreview) return null;
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b-[0.5px] border-gold/20 bg-gold/10 px-5 py-2 text-sm text-noir">
      <span>
        <span className="font-medium text-gold">DEVICE WORKSPACE</span>
        <span className="ml-3">Data is saved in this browser</span>
      </span>
      <button
        aria-label="Reset workspace"
        className="text-muted"
        onClick={() => {
          if (
            window.confirm(
              "Reset all workspace changes and restore the sample data?",
            )
          )
            void import("../../lib/preview").then(({ resetPreview }) => {
              resetPreview();
              window.location.reload();
            });
        }}
      >
        Reset workspace
      </button>
    </div>
  );
}
