interface ContainerProps {
  children: React.ReactNode;
}

export default function Container({ children }: ContainerProps) {
  return (
    <div
      className="flex flex-col items-start bg-black px-10"
      style={{ minHeight: "200svw" }}
    >
      {children}
    </div>
  );
}
