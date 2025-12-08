import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Projeto ICRE Iniciado 🚀
        </h1>
        <p className="text-slate-600 text-lg mb-8">
          Ambiente configurado com Next.js, Tailwind e Shadcn/ui.
        </p>
        <div className="flex gap-4">
          <Button>Botão Primário</Button>
          <Button variant="outline">Botão Secundário</Button>
        </div>
      </div>
    </main>
  );
}