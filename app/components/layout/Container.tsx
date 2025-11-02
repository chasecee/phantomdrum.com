interface ContainerProps {
  children: React.ReactNode;
  scrollHeight?: number;
}

export default function Container({ children, scrollHeight }: ContainerProps) {
  return (
    <div
      className="flex flex-col items-start px-6"
      style={{ height: scrollHeight ? `${scrollHeight}px` : "300svh" }}
    >
      {children}
    </div>
  );
}
