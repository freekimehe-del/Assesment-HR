/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DigitalCertificate } from "../types";
import { 
  Award, 
  CheckCircle, 
  ShieldCheck, 
  FileCheck, 
  QrCode, 
  Search, 
  Calendar, 
  Hash, 
  ArrowLeft,
  X,
  Info
} from "lucide-react";

interface CertificateViewerProps {
  certificateId?: string;
  onBack: () => void;
}

export default function CertificateViewer(props: CertificateViewerProps) {
  const [cert, setCert] = useState<DigitalCertificate | null>(null);
  const [searchHash, setSearchHash] = useState(props.certificateId || "");
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (props.certificateId) {
      handleVerify(props.certificateId);
    }
  }, [props.certificateId]);

  const handleVerify = async (hashToVerify: string) => {
    if (!hashToVerify.trim()) return;
    setLoading(true);
    setError(null);
    setVerifiedData(null);

    try {
      const res = await fetch(`/api/certificate/verify/${hashToVerify.trim()}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "No certificate matching that token or ID was found in the SaaS registry.");
      }

      setCert(data.certificate);
      setVerifiedData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative" id="cert-viewer-root">
      
      {/* Header banner */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between relative z-20">
        <button
          onClick={props.onBack}
          className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          id="cert-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Workspace</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="font-mono text-[10px] font-bold">Verified Registry Node Active</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10 w-full">
        
        {/* LEFT COLUMN: Certificate Visual Template (Col-span-8) */}
        <section className="lg:col-span-8 flex flex-col items-center bg-white border border-slate-200 rounded-xl p-6 shadow-xs" id="cert-render-col">
          {cert ? (
            <div className="w-full max-w-2xl bg-slate-900 border-[10px] border-slate-800 rounded-2xl p-10 text-center relative overflow-hidden shadow-md" id="cert-canvas">
              {/* Outer double border detailing */}
              <div className="absolute inset-3 border border-emerald-500/10 rounded-xl pointer-events-none"></div>
              
              {/* Corner graphics */}
              <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-emerald-500/30"></div>
              <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-emerald-500/30"></div>
              <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-emerald-500/30"></div>
              <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-emerald-500/30"></div>

              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>

              <div className="space-y-5 relative z-10">
                <div className="flex justify-center mb-1">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400">
                    <Award className="w-10 h-10" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h1 className="text-lg font-bold uppercase tracking-widest text-emerald-400">Certificate of Competency</h1>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-mono">Verified Resource Screening Platform</span>
                </div>

                <p className="text-slate-400 text-[11px] italic max-w-md mx-auto leading-relaxed font-sans">
                  This digitally signed credential certifies that the following candidate has successfully completed overall technical evaluations, algorithmic playground criteria and AI code reviews under SOC 2 proctor parameters.
                </p>

                <div className="py-4 border-y border-slate-800 max-w-md mx-auto my-3 space-y-3">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-mono">Candidate ID Record</span>
                    <span className="text-xl font-bold text-white tracking-tight block mt-0.5">{cert.candidateName}</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-mono">Technology Competency Domain</span>
                    <span className="text-sm font-bold text-emerald-300 block mt-0.5">{cert.technologyArea}</span>
                  </div>
                </div>

                {/* Sub row stats */}
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs py-1" id="cert-attributes-strip">
                  <div className="text-center">
                    <span className="text-[9px] text-slate-500 block font-mono uppercase">Screening Grade</span>
                    <span className="font-bold text-white block mt-0.5 font-mono text-xs">{cert.score}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] text-slate-500 block font-mono uppercase">Issued Date</span>
                    <span className="font-bold text-slate-300 block mt-0.5 font-mono text-xs">{cert.assessmentDate}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] text-slate-500 block font-mono uppercase">Validity bounds</span>
                    <span className="font-bold text-slate-300 block mt-0.5 font-mono text-xs">{cert.validityPeriod}</span>
                  </div>
                </div>

                {/* Bottom signatures & QR verification code lookup */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 max-w-lg mx-auto pt-6 border-t border-slate-800" id="cert-signatures-row">
                  <div className="text-left space-y-0.5">
                    <span className="text-[9px] text-slate-600 uppercase font-mono tracking-wider block">Verification Hash Token:</span>
                    <span className="font-mono text-[11px] text-emerald-400 font-bold block">{cert.verificationHash}</span>
                    <span className="text-[9px] text-slate-600 font-mono block">Certificate ID: {cert.id}</span>
                  </div>

                  {/* Visual QR element */}
                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-slate-950" />
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="w-full max-w-xl bg-slate-50 border border-slate-200 rounded-xl p-10 text-center text-slate-500 font-sans space-y-2">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No active certificate has been parsed.</p>
              <p className="text-[11px] text-slate-450 leading-relaxed max-w-sm mx-auto">
                Use the verification form on the right to load and authenticate credentials from the SaaS cloud registry ledger.
              </p>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Interactive Registry Lookup Form (Col-span-4) */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs" id="lookup-form-col">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>SaaS Registry Search</span>
            </h3>
            <p className="text-slate-450 text-[11px] mt-1 leading-relaxed">
              Verify resource authenticity directly. Copy-paste the certificate hash or ID to check real-time database registries.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Verification Hash / ID</label>
              <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                <input
                  type="text"
                  placeholder="e.g. 6c4f3a5b28d7a1e0"
                  value={searchHash}
                  onChange={(e) => setSearchHash(e.target.value)}
                  className="flex-grow px-2.5 py-1.5 text-xs bg-transparent border-none outline-none text-slate-800 font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify(searchHash)}
                />
                <button
                  onClick={() => handleVerify(searchHash)}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 leading-relaxed">
                *Demo verification hash lookup token: <br/><b className="text-indigo-600 font-mono">6c4f3a5b28d7a1e0</b>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-250 rounded-lg text-rose-700 text-[11px] flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Verification Status output card */}
            {verifiedData && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2.5 text-xs" id="verification-status-card">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>REGISTRY VERIFIED</span>
                </div>
                
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Registry Status:</span>
                    <span className="font-bold text-emerald-700 uppercase font-mono text-[10px]">{verifiedData.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SaaS Issuer Node:</span>
                    <span className="font-mono text-[10px] text-slate-700 font-semibold">Unified Competency Registry</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Authorized stamp:</span>
                    <span className="font-mono text-[10px] text-slate-700 font-semibold">{verifiedData.timestamp.split("T")[0]}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
