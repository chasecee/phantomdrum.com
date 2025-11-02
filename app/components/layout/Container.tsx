interface ContainerProps {
  children: React.ReactNode;
}

export default function Container({ children }: ContainerProps) {
  return (
    <div
      className="flex flex-col items-start px-10"
      style={{ minHeight: "300svw" }}
    >
      {children}
    </div>
  );
}
