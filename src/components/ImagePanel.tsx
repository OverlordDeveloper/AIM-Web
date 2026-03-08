interface ImagePanelProps {
  title: string;
  imgSrc: string | null;
}

const ImagePanel = ({ title, imgSrc }: ImagePanelProps) => {
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <h2 className="text-lg font-semibold text-foreground tracking-wide">
        {title}
      </h2>
      <div className="aspect-square w-full rounded-xl bg-background border-2 border-primary/30 shadow-glow overflow-hidden flex items-center justify-center">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground text-sm">No feed</div>
        )}
      </div>
    </div>
  );
};

export default ImagePanel;
