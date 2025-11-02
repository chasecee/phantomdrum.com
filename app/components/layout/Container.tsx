interface ContainerProps {
  children: React.ReactNode;
}

export default function Container({ children }: ContainerProps) {
  return (
    <div
      className="flex flex-col items-start px-6"
      style={{ height: "200svh" }}
    >
      {children}
    </div>
  );
}
