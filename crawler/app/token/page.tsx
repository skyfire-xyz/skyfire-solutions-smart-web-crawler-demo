"use client"

import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import CrawlSearchLog from "../components/CrawlSearchLog";
import axios, { AxiosResponse } from "axios";

const SELLER_SERVICE = {
    name: process.env.NEXT_PUBLIC_SELLER_SERVICE_NAME, 
    tokenAmount: process.env.NEXT_PUBLIC_DEFAULT_TOKEN_AMOUNT, 
    priceDisplay: process.env.NEXT_PUBLIC_PRICE_DISPLAY
};

export default function CrawlWithTokenPage() {
    const [kyaPayToken, setKyaPayToken] = useState<string | null>("")
    const [decodedToken, setDecodedToken] = useState<any>(null)
    const [tokenAmount, setTokenAmount] = useState<string | undefined>(SELLER_SERVICE.tokenAmount);

    const handleStartOver = async () => {
      setKyaPayToken(null)
      setDecodedToken(null);
    }

    const handleCreateToken = async () => {
        const response: AxiosResponse<{token:string}> = await axios.post(`${process.env.NEXT_PUBLIC_SERVICE_BASE_URL}/token`, {tokenAmount: tokenAmount});
        console.log("response",  response);

        if (!response) {
            console.error("Unable to create kya+pay token");
            return;
        }
        console.log("kya+pay token created", response.data.token);
        setKyaPayToken(response.data.token);
        setDecodedToken(null); // Reset decoded token when a new one is created
    }

    const isJWT = (token: string): boolean => {
        const parts = token.split('.')
        if (parts.length !== 3) {
            return false;
        }
        try {
            const header = JSON.parse(atob(parts[0]));
            if (!header || !header.alg) {
                return false;
            }
            JSON.parse(atob(parts[1]));
        } catch {
            return false;
        }
        return true;
    }

    const handleDecodeToken = () => {
        if (!kyaPayToken) return;
        if (isJWT(kyaPayToken)) {
            try {
                const header = jwtDecode(kyaPayToken, { header: true });
                const payload = jwtDecode(kyaPayToken);
                setDecodedToken({ header, payload });
            } catch (err) {
                setDecodedToken({ error: "Failed to decode token." });
            }
        } else {
            setDecodedToken({ error: "Token is not a valid JWT." });
        }
    }

    return (
        <div className="w-full p-6 bg-[#fafbfc] min-h-screen">
            <h2 className="text-2xl font-bold mb-1">Step 1: Create KYA+PAY Token</h2>
            <div className="mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 shadow-md mt-6 w-full">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm">Seller Service:</span>
                  <span className="font-semibold text-base text-gray-900">{SELLER_SERVICE.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm">Minimum Token Amount:</span>
                  <span className="font-semibold text-base text-gray-900">${SELLER_SERVICE.priceDisplay}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm">Set Token Amount:</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tokenAmount}
                    onChange={e => setTokenAmount(e.target.value)}
                    className="font-bold border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-gray-900"
                  />
                </div>
              </div>
            </div>
            {
            kyaPayToken ? 
            <>
              <div className="flex gap-2 mt-4">
                  <button
                      className="px-6 py-2 bg-black text-white rounded font-semibold hover:bg-gray-800 transition disabled:opacity-60"
                      onClick={handleStartOver}
                  >
                      ↻ Start Over
                  </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold mt-5 mb-1">Step 2: Inspect the created token</h2>
                <div className="bg-white shadow-md rounded-lg p-6 mt-6 w-full border border-gray-200 flex flex-col gap-4">
                  <div className="break-all text-gray-900 text-base">
                    {kyaPayToken}
                  </div>
                  <button
                    className="px-6 py-2 bg-black text-white rounded font-semibold hover:bg-gray-800 transition mb-4 mt-2 w-fit"
                    onClick={handleDecodeToken}
                  >
                    Decode Token
                  </button>
                  {decodedToken && (
                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-900 overflow-x-auto">
                      {decodedToken.error ? (
                        <div className="text-red-600">{decodedToken.error}</div>
                      ) : (
                        <>
                          <div className="font-semibold mb-1">Header:</div>
                          <pre className="mb-2 whitespace-pre-wrap break-all">{JSON.stringify(decodedToken.header, null, 2)}</pre>
                          <div className="font-semibold mb-1">Payload:</div>
                          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(decodedToken.payload, null, 2)}</pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-1">Step 3: Select website to crawl</h2>
                  <div className="mt-6">
                    <CrawlSearchLog skyfireKyaPayToken={kyaPayToken} />
                  </div>
                </div>
                </div>
                </>
             :  
              <div className="flex gap-2 mt-4">
                  <button
                      className="px-6 py-2 bg-black text-white rounded font-semibold hover:bg-gray-800 transition disabled:opacity-60"
                      onClick={handleCreateToken}
                  >
                      Create Token
                  </button>
              </div>
            }
        </div>
    )
} 