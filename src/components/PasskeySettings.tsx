import { useCallback, useEffect, useState } from "react";
import { usePasskey, usePasskeySupport, PasskeyCredential } from "@/hooks/usePasskey";

export function PasskeySettings() {
  const [credentials, setCredentials] = useState<PasskeyCredential[]>([]);
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const { register, list, revoke, loading, error } = usePasskey();
  const { available, reason } = usePasskeySupport();

  const loadCredentials = useCallback(async () => {
    const result = await list();
    if (result.success) {
      setCredentials(result.credentials || []);
    }
  }, [list]);

  useEffect(() => {
    void loadCredentials();
  }, [loadCredentials]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await register(newPasskeyName || undefined);
    if (result.success) {
      setNewPasskeyName("");
      void loadCredentials();
    }
  };

  const handleRevoke = async (credentialId: string) => {
    if (!confirm("Are you sure you want to remove this passkey? This cannot be undone.")) return;
    const result = await revoke(String(credentialId));
    if (result.success) {
      void loadCredentials();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatTransports = (transports: string[]) => {
    const icons: Record<string, string> = {
      internal: "🔐 Platform",
      hybrid: "🔄 Hybrid",
      ble: "📱 Bluetooth",
      usb: "🔌 USB",
      nfc: "📶 NFC",
    };
    return transports.map((t) => icons[t] || t).join(", ") || "Unknown";
  };

  return (
    <section className="passkey-settings">
      <h2>Passkeys</h2>
      <p className="muted">
        Use Face ID, Touch ID, Windows Hello, or your device PIN to sign in securely without
        passwords. Kurukoo records the authenticator backup flag, but does not claim that a passkey
        is currently available on another device.
      </p>

      {!available ? (
        <div className="empty-state">
          <p>Passkeys are not available on this device.</p>
          <p className="muted">{reason}</p>
        </div>
      ) : null}

      {available && error ? <div className="error-message">{error}</div> : null}

      {!available ? null : (
        <>
      {credentials.length === 0 ? (
        <div className="empty-state">
          <p>No passkeys set up yet.</p>
          <form onSubmit={handleRegister} className="passkey-form">
            <input
              type="text"
              value={newPasskeyName}
              onChange={(e) => setNewPasskeyName(e.target.value)}
              placeholder="Device name (e.g., 'My iPhone', 'MacBook Pro')"
              className="input-field"
            />
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Creating..." : "Create passkey"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="credentials-list">
            {credentials.map((cred) => (
              <div key={cred.id} className="credential-card">
                <div className="credential-info">
                  <div className="credential-header">
                    <strong>{cred.name || "Unnamed passkey"}</strong>
                    <span className={cred.backedUp ? "badge badge-success" : "badge badge-warning"}>
                      {cred.backedUp ? "Backed up" : "Device-only"}
                    </span>
                  </div>
                  <div className="credential-details">
                    <span>Type: {cred.credentialType}</span>
                    <span>Transports: {formatTransports(cred.transports)}</span>
                    <span>Created: {formatDate(cred.createdAt)}</span>
                    <span>Last used: {formatDate(cred.lastUsedAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(cred.credentialId)}
                  disabled={loading}
                  className="btn btn-danger btn-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="add-another">
            <p>Add another passkey for a new device:</p>
            <form onSubmit={handleRegister} className="passkey-form">
              <input
                type="text"
                value={newPasskeyName}
                onChange={(e) => setNewPasskeyName(e.target.value)}
                placeholder="Device name (e.g., 'Work laptop', 'iPad')"
                className="input-field"
              />
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "Creating..." : "Add passkey"}
              </button>
            </form>
          </div>
        </>
      )}
        </>
      )}
    </section>
  );
}

export function PasskeyLoginButton({
  phone,
  onSuccess,
}: {
  phone: string;
  onSuccess?: () => void;
}) {
  const { login, loading, error } = usePasskey();
  const { available } = usePasskeySupport();

  if (!available) return null;

  const handleLogin = async () => {
    const result = await login(phone);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="passkey-login">
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading || !phone}
        className="btn btn-secondary"
      >
        {loading ? "Verifying..." : "Sign in with passkey"}
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export function PasskeyReauthButton({
  phone,
  onSuccess,
}: {
  phone: string;
  onSuccess?: () => void;
}) {
  const { reauth, loading, error } = usePasskey();

  const handleReauth = async () => {
    const result = await reauth(phone);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="passkey-reauth">
      <p className="muted">Verify your identity to continue</p>
      <button
        type="button"
        onClick={handleReauth}
        disabled={loading || !phone}
        className="btn btn-primary"
      >
        {loading ? "Verifying..." : "Verify with passkey"}
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
