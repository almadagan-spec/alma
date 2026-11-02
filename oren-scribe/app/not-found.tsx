import Link from "next/link";

export default function NotFound() {
  return (
    <main className="p-10 text-center">
      <p className="mb-4">הביקור לא נמצא.</p>
      <Link href="/" className="underline">חזרה לדף הראשי</Link>
    </main>
  );
}
