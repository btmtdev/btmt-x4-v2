import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, Trash2, Image } from "lucide-react"

const WAREHOUSE_URL = import.meta.env.VITE_WAREHOUSE_API_URL ?? "/warehouse"

export default function WarehousePhotoPage() {
  const [gcosNo, setGcosNo] = useState("")
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState([])
  const fileRef = useRef()
  const cameraRef = useRef()

  const handleFiles = async (fileList) => {
    if (!fileList?.length) return
    setUploading(true)
    for (const file of fileList) {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("gcos_no", gcosNo)
      const res = await fetch(`${WAREHOUSE_URL}/api/picking/photo`, { method: "POST", body: fd }).then(r => r.json()).catch(() => null)
      if (res?.status) setPhotos(p => [...p, { url: res.data.url, name: file.name }])
    }
    setUploading(false)
  }

  const removePhoto = (i) => setPhotos(photos.filter((_, idx) => idx !== i))

  const loadPhotos = async () => {
    if (!gcosNo) return
    const res = await fetch(`${WAREHOUSE_URL}/api/picking/${gcosNo}/photos`).then(r => r.json()).catch(() => null)
    if (res?.status) setSaved(res.data || [])
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold">Picking Photos</h1>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">GCOS No</label>
          <input className="border rounded px-3 py-1.5 w-full text-sm" value={gcosNo} onChange={e => setGcosNo(e.target.value)} placeholder="Enter GCOS No" />
        </div>
        <Button size="sm" variant="outline" onClick={loadPhotos}>Load</Button>
      </div>

      {/* Upload buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload size={14} className="mr-1" /> Upload Photo
        </Button>
        <Button variant="outline" onClick={() => cameraRef.current?.click()}>
          <Camera size={14} className="mr-1" /> Take Photo
        </Button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {uploading && <p className="text-sm text-primary animate-pulse">Uploading...</p>}

      {/* New uploads */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">New Photos ({photos.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((photo, i) => (
              <div key={i} className="relative border rounded-lg overflow-hidden group">
                <img src={photo.url} alt={photo.name} className="w-full h-40 object-cover" />
                <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 size={12} />
                </button>
                <p className="text-[10px] text-muted-foreground px-2 py-1 truncate">{photo.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved photos */}
      {saved.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Saved Photos ({saved.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {saved.map((photo, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <img src={photo.url} alt={photo.file_name} className="w-full h-40 object-cover" />
                <p className="text-[10px] text-muted-foreground px-2 py-1 truncate">{photo.file_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length === 0 && saved.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
          <Image size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No photos yet. Upload or take a photo during picking.</p>
        </div>
      )}
    </div>
  )
}
