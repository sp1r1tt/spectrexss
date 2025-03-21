import { useState, useEffect } from "react";
import { Search } from "lucide-react"; 
import { Button } from "./ui/button";
import LogoEvil from "../assets/logo.svg";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Toaster, toast } from "sonner"; 

interface Vulnerability {
  type: string;
  description: string;
  severity: "high";
  payload: string;
  testUrl: string;
}

export default function XSSScanner() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [results, setResults] = useState<{
    url: string;
    vulnerabilities: Vulnerability[];
    scanTime: string;
  } | null>(null);
  const [previousResults, setPreviousResults] = useState<{
    url: string;
    vulnerabilities: Vulnerability[];
    scanTime: string;
  } | null>(null);
  const [customPayloads, setCustomPayloads] = useState<string[]>([]);
  const [customUrls, setCustomUrls] = useState<string[]>([]);

  useEffect(() => {
    const savedResults = localStorage.getItem("scanResults");
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    }
  }, []);

  useEffect(() => {
    if (results) {
      localStorage.setItem("scanResults", JSON.stringify(results));
    } else {
      localStorage.removeItem("scanResults");
    }
  }, [results]);


  const handlePayloadFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain") {
      toast("Please upload a .txt file for payloads.", {
        action: {
          label: "Undo",
          onClick: () => console.log("Undo clicked"),
        },
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const payloads = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      setCustomPayloads(payloads); 
      toast(`Loaded ${payloads.length} payloads from file.`, {
        action: {
          label: "Undo",
          onClick: () => console.log("Undo clicked"),
        },
      });
    };
    reader.onerror = () => {
      toast("Error reading payloads file.", {
        action: {
          label: "Undo",
          onClick: () => console.log("Undo clicked"),
        },
      });
    };
    reader.readAsText(file);
  };


  const handleUrlsFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain") {
      toast("Please upload a .txt file for URLs.", {
        action: {
          label: "Undo",
          onClick: () => console.log("Undo clicked"),
        },
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const urls = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      setCustomUrls(urls);
      toast(`Loaded ${urls.length} URLs from file.`, {
        action: {
          label: "Undo",
          onClick: () => console.log("Undo clicked"),
        },
      });
    };
    reader.onerror = () => {
      toast("Error reading URLs file.", {
        action: {
          label: "Undo",
          onClick: () => console.log("Undo clicked"),
        },
      });
    };
    reader.readAsText(file);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();

    const urlsToScan = customUrls.length > 0 ? customUrls : url ? [url] : [];
    if (urlsToScan.length === 0) {
      toast("Please provide a URL or upload a file with URLs.", {
        action: {
          label: "Undo",
          onClick: () => console.log("Undo clicked"),
        },
      });
      return;
    }

    setScanning(true);
    setProgress(0); 

    try {
      const vulnerabilities: Vulnerability[] = [];
      const totalUrls = urlsToScan.length;

      for (let i = 0; i < totalUrls; i++) {
        const scanUrl = urlsToScan[i];

        setProgress(Math.round(((i + 1) / totalUrls) * 100));

        const response = await fetch("/api/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: scanUrl,
            payloads: customPayloads.length > 0 ? customPayloads : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Server error");
        }

        const data = await response.json();
        vulnerabilities.push(...data.vulnerabilities);
      }

      setResults({
        url: urlsToScan.join(", "),
        vulnerabilities,
        scanTime: new Date().toLocaleString(),
      });

      if (vulnerabilities.length === 0) {
        toast("No vulnerabilities detected.", {
          action: {
            label: "Undo",
            onClick: () => console.log("Undo clicked"),
          },
        });
      }
    } catch (error) {
      console.error("Error during scan:", error);
      setResults({
        url: urlsToScan.join(", "),
        vulnerabilities: [],
        scanTime: new Date().toLocaleString(),
      });
      toast("Error during scan. Please try again.", {
        action: {
          label: "Undo",
          onClick: () => console.log("Undo clicked"),
        },
      });
    } finally {
      setScanning(false);
    }
  };

  const handleClear = () => {
    setPreviousResults(results);
    setResults(null);
    setCustomPayloads([]);
    setCustomUrls([]);
    setProgress(0); 
    toast("Results cleared successfully!", {
      action: {
        label: "Undo",
        onClick: () => {
          if (previousResults) {
            setResults(previousResults);
            setPreviousResults(null);
          }
        },
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="fog-container">
          <div className="fog-img fog-img-first"></div>
          <div className="fog-img fog-img-second"></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto py-10 px-4">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <img src={LogoEvil.src} alt="My Logo" className="w-16 h-28" />
            <div className="flex flex-col items-center">
              <h1 className="text-4xl font-bold text-white">SpectreXSS</h1>
            </div>
          </div>
          <p className="text-gray-400 text-center max-w-2xl">
            Scan websites for potential Cross-Site Scripting vulnerabilities
          </p>
        </div>

        <Card className="w-full max-w-3xl mx-auto bg-black/60 border-gray-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Scan URL</CardTitle>
            <CardDescription>Enter a URL or upload a file with URLs to scan for Reflected XSS</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScan} className="space-y-4">
              <div className="flex w-full items-center space-x-2">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-gray-900/60 border-gray-700 text-white"
                  disabled={customUrls.length > 0} 
                />
                <Button type="submit" disabled={scanning}>
                  {scanning ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Scanning
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Scan
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm text-gray-400">Upload URLs (.txt file)</label>
                <Input
                  type="file"
                  accept=".txt"
                  onChange={handleUrlsFileUpload}
                  className="bg-gray-900/60 border-gray-700 text-white"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm text-gray-400">Upload Custom Payloads (.txt file)</label>
                <Input
                  type="file"
                  accept=".txt"
                  onChange={handlePayloadFileUpload}
                  className="bg-gray-900/60 border-gray-700 text-white"
                />
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">{progress}% completed</p>
            </form>
          </CardContent>
        </Card>

        {results && (
          <Card className="w-full max-w-3xl mx-auto mt-8 bg-black/60 border-gray-800 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Scan Results</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClear}>
                  Clear Results
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="vulnerabilities">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <TabsContent value="vulnerabilities">
                  {results.vulnerabilities.length > 0 ? (
                    <div className="space-y-4 mt-4">
                      {results.vulnerabilities.map((vuln, index) => (
                        <div key={index} className="p-4 rounded-lg border border-gray-800 bg-gray-900/40">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-white">{vuln.type}</h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                vuln.severity === "high"
                                  ? "bg-red-900/60 text-red-200"
                                  : vuln.severity === "medium"
                                  ? "bg-yellow-900/60 text-yellow-200"
                                  : "bg-blue-900/60 text-blue-200"
                              }`}
                            >
                              {vuln.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm">{vuln.description}</p>
                          <p className="text-gray-500 text-xs mt-1">Payload: {vuln.payload}</p>
                          <p className="text-gray-500 text-xs">Test URL: {vuln.testUrl}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-400">No vulnerabilities detected</div>
                  )}
                </TabsContent>
                <TabsContent value="details">
                  <div className="space-y-4 mt-4">
                    <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/40">
                      <h3 className="font-medium text-white mb-2">Scan Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-400">URL(s):</div>
                        <div className="text-white">{results.url}</div>
                        <div className="text-gray-400">Scan Time:</div>
                        <div className="text-white">{results.scanTime}</div>
                        <div className="text-gray-400">Vulnerabilities:</div>
                        <div className="text-white">{results.vulnerabilities.length}</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t border-gray-800 pt-4 flex flex-col items-center text-center">
              <p className="text-xs text-gray-500">
                This scanner is for educational purposes only. Ensure proper authorization before use.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Created by <span className="text-white font-semibold">sp1r1t</span>
              </p>
            </CardFooter>
          </Card>
        )}
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "black",
            color: "white",
            border: "1px solid #1f2937",
          },
        }}
      />
    </div>
  );
}
