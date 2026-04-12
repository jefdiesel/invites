"use client";

import { useState } from "react";
import { deletePoll } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function DeletePollButton({ pollId }: { pollId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    await deletePoll(pollId);
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[11px] font-medium text-rose-600 hover:text-rose-700 transition-colors"
        >
          {deleting ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-[11px] text-stone-400 hover:text-rose-500 transition-colors"
    >
      Delete
    </button>
  );
}
