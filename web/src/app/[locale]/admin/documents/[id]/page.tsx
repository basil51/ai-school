"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ChunkItem {
  id: string;
  docId: string;
  content: string;
  createdAt: string;
}

export default function ManageChunksPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
  const [pageSize, setPageSize] = useState<number>(Number(searchParams.get("pageSize") || 20));
  const [total, setTotal] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session as any).role !== "admin") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!params?.id) return;
    fetchChunks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id, page, pageSize]);

  const fetchChunks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/documents/${params.id}/chunks?page=${page}&pageSize=${pageSize}`);
      if (res.ok) {
        const data = await res.json();
        setChunks(data.chunks);
        setTotal(data.total);
      }
    } catch (e) {
      console.error("Failed to fetch chunks", e, pageSize);
    } finally {
      setLoading(false);
    }
  };

  const onSelect = (chunk: ChunkItem) => {
    setSelectedId(chunk.id);
    setEditContent(chunk.content);
  };

  const onSave = async () => {
    if (!selectedId) return;
    setSavingId(selectedId);
    try {
      const res = await fetch(`/api/admin/chunks/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        await fetchChunks();
      }
    } catch (e) {
      console.error("Failed to save chunk", e);
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this chunk?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/chunks/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedId === id) {
          setSelectedId(null);
          setEditContent("");
        }
        await fetchChunks();
      }
    } catch (e) {
      console.error("Failed to delete chunk", e);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Chunks</h1>
          <p className="text-muted-foreground">Document ID: {params.id}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin")}>Back to Admin</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chunks</CardTitle>
            <CardDescription>Click a row to edit</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center">Loading...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chunks.map((c) => (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => onSelect(c)}>
                        <TableCell className="max-w-[160px] truncate">{c.id}</TableCell>
                        <TableCell className="max-w-[320px] truncate">{c.content}</TableCell>
                        <TableCell>{new Date(c.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} disabled={deletingId === c.id}>
                              {deletingId === c.id ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Total: {total}</Badge>
                    <Badge variant="outline">Page {page} / {totalPages}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit Chunk</CardTitle>
            <CardDescription>Update content and re-embed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Chunk ID</Label>
              <Input value={selectedId || ""} readOnly />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea className="min-h-[280px]" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={onSave} disabled={!selectedId || savingId === selectedId}>{savingId === selectedId ? "Saving..." : "Save Changes"}</Button>
              <Button variant="outline" onClick={() => { setSelectedId(null); setEditContent(""); }} disabled={!selectedId}>Clear</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


