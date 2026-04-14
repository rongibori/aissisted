"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { integrations as integrationsApi } from "../../lib/api";
import { Card, Button, Spinner, Badge } from "../../components/ui";

interface ConnectedProvider {
  connectedAt: string;
}

type Status = Record<string, ConnectedProvider>;

const PROVIDERS = [
  {
    id: "whoop",
    name: "WHOOP",
    description: "Recovery score, HRV, sleep performance, and resting heart rate.",
    icon: "⌚",
    connect: () => integrationsApi.whoopConnect(),
    canSync: true,
    sync: () => integrationsApi.whoopSync(),
  },
  {
    id: "apple_health",
    name: "Apple Health",
    description: "Upload your Apple Health export.xml to import biomarkers.",
    icon: "",
    connect: null,
    canSync: false,
  },
  {
    id: "fhir",
    name: "Epic / MyChart",
    description: "SMART on FHIR — fetch lab results, conditions, and medications directly from your EHR.",
    icon: "🏥",
    connect: () => integrationsApi.fhirConnect(),
    canSync: true,
    sync: () => integrationsApi.fhirSync().then((r) => ({ synced: r.observations })),
  },
];

export default function IntegrationsPage() {
  const [status, setStatus] = useState<Status>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await integrationsApi.status();
      setStatus(data.connected);
    } catch {
      // Not fatal — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Reload if returning from OAuth redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) load();
  }, [load]);

  const handleSync = async (providerId: string, syncFn: () => Promise<{ synced: number }>) => {
    setSyncing(providerId);
    try {
      const result = await syncFn();
      setSyncResult((r) => ({
        ...r,
        [providerId]: `Synced ${result.synced} biomarker${result.synced !== 1 ? "s" : ""}`,
      }));
    } catch (err: any) {
      setSyncResult((r) => ({ ...r, [providerId]: `Sync failed: ${err.message}` }));
    } finally {
      setSyncing(null);
    }
  };

  const handleAppleHealthUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const xml = await file.text();
      const result = await integrationsApi.appleHealthUpload(xml);
      setSyncResult((r) => ({
        ...r,
        apple_health: `Imported ${result.imported} of ${result.parsed} records`,
      }));
      await load();
    } catch (err: any) {
      setSyncResult((r) => ({ ...r, apple_health: `Upload failed: ${err.message}` }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-[#e8e8f0] mb-2">Integrations</h1>
      <p className="text-sm text-[#7a7a98] mb-8">
        Connect data sources to power your personalized protocol.
      </p>

      <div className="flex flex-col gap-4">
        {PROVIDERS.map((provider) => {
          const connected = !!status[provider.id];
          const connectedAt = status[provider.id]?.connectedAt;
          const message = syncResult[provider.id];

          return (
            <Card key={provider.id}>
              <div className="flex items-start gap-4">
                <span className="text-2xl">{provider.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#e8e8f0]">{provider.name}</span>
                    {connected && (
                      <Badge variant="success">Connected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#7a7a98] mb-3">{provider.description}</p>

                  {connected && connectedAt && (
                    <p className="text-xs text-[#7a7a98] mb-3">
                      Connected {new Date(connectedAt).toLocaleDateString()}
                    </p>
                  )}

                  {message && (
                    <p className="text-xs text-emerald-400 mb-3">{message}</p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Apple Health: file upload instead of OAuth */}
                    {provider.id === "apple_health" ? (
                      <>
                        <input
                          ref={fileRef}
                          type="file"
                          accept=".xml"
                          className="hidden"
                          onChange={handleAppleHealthUpload}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={uploading}
                          onClick={() => fileRef.current?.click()}
                        >
                          Upload export.xml
                        </Button>
                      </>
                    ) : (
                      <>
                        {!connected && provider.connect && (
                          <Button
                            size="sm"
                            onClick={() => provider.connect!()}
                          >
                            Connect
                          </Button>
                        )}
                        {connected && provider.canSync && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={syncing === provider.id}
                            onClick={() =>
                              handleSync(provider.id, provider.sync!)
                            }
                          >
                            Sync now
                          </Button>
                        )}
                        {!connected && !provider.connect && (
                          <span className="text-xs text-[#7a7a98]">
                            Configure FHIR credentials to connect
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
