interface ContainerProps {
  children: React.ReactNode;
}

export default function Container({ children }: ContainerProps) {
  return (
    <div className="flex h-[300svh] flex-col items-start bg-black border-b-8 border-b-red-400">
      {children}
    </div>
  );
}
