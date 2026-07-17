import { BackButton } from "../../../../components/navigation/BackButton";

export default function CollectionNotFound() {
  return (
    <main className="not-found-state">
      <h1>Collection not found</h1>
      <p>The requested collection could not be found.</p>
      <BackButton />
    </main>
  );
}
