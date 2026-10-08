import { useEffect, useState } from "react";
import { AlertCircle, FileUp, LoaderCircle, ScanSearch, Sparkles } from "lucide-react";
import { apiPost, apiUpload } from "../../services/api.js";

function similarityPercent(result) {
  const percent = Number(result.percent ?? Number(result.similarity ?? 0) * 100);
  return Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
}

function resultStyle(percent) {
  if (percent >= 85) return "border-rose-200 bg-rose-50 text-rose-700";
  if (percent >= 70) return "border-orange-200 bg-orange-50 text-orange-700";
  if (percent >= 50) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function AiSimilarityPage({ topics, initialTopic, onInitialTopicUsed }) {
  const [title, setTitle] = useState(initialTopic?.title || "");
  const [sourceTopicId, setSourceTopicId] = useState(initialTopic?.id ? String(initialTopic.id) : "");
  const [topK, setTopK] = useState(10);
  const [results, setResults] = useState([]);
  const [checkedTitle, setCheckedTitle] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extraction, setExtraction] = useState(null);

  useEffect(() => {
    if (!initialTopic) return;
    setTitle(initialTopic.title || "");
    setSourceTopicId(String(initialTopic.id));
    setResults([]);
    setError("");
    setExtraction(null);
    setSelectedFile(null);
    onInitialTopicUsed();
  }, [initialTopic, onInitialTopicUsed]);

  const extractFile = async () => {
    if (!selectedFile) {
      setError("Hãy chọn một tệp PDF hoặc DOCX trước.");
      return;
    }
    setExtracting(true);
    setError("");
    setResults([]);
    setExtraction(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const payload = await apiUpload("/similarity/checks/extract-file/", formData);
      if (!Array.isArray(payload?.title_candidates) || !payload.suggested_title) {
        throw new Error("Backend chưa trả về được tên đề tài gợi ý.");
      }
      setExtraction(payload);
      setTitle(payload.suggested_title);
      setSourceTopicId("");
    } catch (requestError) {
      setError(requestError.message || "Không trích xuất được tên đề tài từ tệp.");
    } finally {
      setExtracting(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setChecking(true);
    setError("");
    setResults([]);
    try {
      const payload = await apiPost("/similarity/checks/check/", {
        title: title.trim(),
        top_k: Number(topK),
        ...(sourceTopicId ? { source_topic_id: Number(sourceTopicId) } : {}),
      });
      if (!Array.isArray(payload?.results)) {
        throw new Error("AI Service trả về danh sách kết quả không hợp lệ.");
      }
      setCheckedTitle(title.trim());
      setResults(payload.results);
    } catch (requestError) {
      setError(requestError.message || "Không thể kiểm tra đề tài bằng AI.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-brand">
            <Sparkles size={21} />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">Kiểm tra độ tương đồng đề tài</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              AI so sánh tên đề tài với các đề tài đã được phê duyệt để hỗ trợ phát hiện nội dung có khả năng trùng lặp.
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
          {topics.length > 0 && (
            <label className="block text-sm font-medium text-slate-700">
              Đề tài trong hệ thống (không bắt buộc)
              <select
                value={sourceTopicId}
                onChange={(event) => {
                  const topic = topics.find((item) => String(item.id) === event.target.value);
                  setSourceTopicId(event.target.value);
                  if (topic) setTitle(topic.title || "");
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand sm:max-w-xl"
              >
                <option value="">Nhập tên đề tài cần kiểm tra</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.title}</option>
                ))}
              </select>
            </label>
          )}
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
            <div className="text-sm font-semibold text-slate-700">Hoặc tải file đề cương</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Hỗ trợ PDF có văn bản và DOCX, tối đa 10 MB. Tệp chỉ được dùng để trích xuất, không lưu trên máy chủ.
              PDF scan/ảnh cần OCR và hiện chưa được hỗ trợ.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] || null);
                  setExtraction(null);
                  setError("");
                }}
                className="block max-w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand"
              />
              <button
                type="button"
                onClick={extractFile}
                disabled={extracting || !selectedFile}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {extracting ? <LoaderCircle size={15} className="animate-spin" /> : <FileUp size={15} />}
                {extracting ? "Đang đọc file..." : "Đọc tên đề tài từ file"}
              </button>
            </div>
            {selectedFile && (
              <p className="mt-2 text-xs text-slate-500">
                {selectedFile.name} · {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>
          {extraction && (
            <div className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
              <div>
                <div className="text-sm font-semibold text-teal-900">Kiểm tra tên đề tài được nhận diện</div>
                <p className="mt-1 text-xs text-teal-800">
                  Hệ thống đã điền gợi ý vào ô bên dưới. Hãy xác nhận hoặc sửa lại trước khi bấm “Kiểm tra bằng AI”.
                </p>
              </div>
              {extraction.title_candidates.length > 1 && (
                <label className="block text-xs font-medium text-teal-900">
                  Các tên có thể là đề tài
                  <select
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-teal-200 bg-white px-3 text-sm text-slate-700"
                  >
                    {extraction.title_candidates.map((candidate, index) => (
                      <option key={`${candidate.title}-${index}`} value={candidate.title}>
                        {candidate.title} ({Math.round(candidate.confidence * 100)}% gợi ý)
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <details className="text-xs text-teal-900">
                <summary className="cursor-pointer font-semibold">Xem nội dung đã trích xuất</summary>
                <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 font-sans leading-5 text-slate-600">
                  {extraction.extracted_text}
                </pre>
              </details>
            </div>
          )}
          <label className="block text-sm font-medium text-slate-700">
            Tên đề tài <span className="text-rose-600">*</span>
            <textarea
              required
              minLength={1}
              maxLength={1000}
              rows={3}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nhập tên đề tài cần kiểm tra..."
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-brand focus:ring-4 focus:ring-teal-50"
            />
            <span className="mt-1 block text-right text-xs font-normal text-slate-400">{title.length}/1000</span>
          </label>
          <div className="flex flex-wrap items-end gap-4">
            <label className="block text-sm font-medium text-slate-700">
              Số kết quả gần nhất
              <input
                type="number"
                min="1"
                max="100"
                value={topK}
                onChange={(event) => setTopK(event.target.value)}
                className="mt-1.5 h-10 w-32 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand"
              />
            </label>
            <button
              type="submit"
              disabled={checking || !title.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checking ? <LoaderCircle size={16} className="animate-spin" /> : <ScanSearch size={16} />}
              {checking ? "Đang phân tích..." : "Kiểm tra bằng AI"}
            </button>
          </div>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 shrink-0" size={17} />
              <span>{error}</span>
            </div>
          )}
        </form>
      </section>

      {results.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-7">
            <h3 className="text-sm font-bold text-ink">Kết quả so sánh</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{checkedTitle}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {results.map((result, index) => {
              const percent = similarityPercent(result);
              return (
                <article key={`${result.topic_id ?? "result"}-${index}`} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-xs font-semibold text-slate-400">
                      {result.topic_id ? `Mã đề tài #${result.topic_id}` : `Kết quả ${index + 1}`}
                    </div>
                    <h4 className="text-sm font-semibold leading-6 text-slate-800">{result.title || "Không có tiêu đề"}</h4>
                    {result.warning && <p className="mt-1 text-xs leading-5 text-amber-700">{result.warning}</p>}
                  </div>
                  <div className={`shrink-0 self-start rounded-xl border px-3 py-2 text-center sm:self-center ${resultStyle(percent)}`}>
                    <div className="text-lg font-bold">{percent.toFixed(1)}%</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide">Tương đồng</div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
      {!checking && checkedTitle && results.length === 0 && !error && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Không tìm thấy đề tài tương đồng trong các kết quả trả về.
        </div>
      )}
    </div>
  );
}
