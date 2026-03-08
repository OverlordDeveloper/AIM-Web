interface ImagePanelProps {
  title: string;
  imgSrc: string | null;
}

const ImagePanel = ({ title, imgSrc }: ImagePanelProps) => {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
          {title}
        </h2>
        <div className={`w-1.5 h-1.5 rounded-full ${imgSrc ? 'bg-status-online' : 'bg-muted-foreground'}`} />
      </div>
      <div className="aspect-square w-full rounded-md bg-card border border-border overflow-hidden flex items-center justify-center">
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
  );
};

export default ImagePanel;
