interface ImagePanelProps {
  title: string;
  imgSrc: string | null;
}

const ImagePanel = ({ title, imgSrc }: ImagePanelProps) => {
  return (
    <div className="w-full h-full flex flex-col gap-1.5 min-h-0">
      <div className="flex items-center justify-between px-1 shrink-0">
        <h2 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        <div className={`w-1.5 h-1.5 rounded-full ${imgSrc ? 'bg-status-online' : 'bg-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <div className="aspect-square w-full max-h-full rounded-md bg-card border border-border overflow-hidden flex items-center justify-center">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center">
                <span className="text-muted-foreground/40 text-lg">⬜</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">NO SIGNAL</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePanel;
