import {
  Cpu,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import { SITE_CONFIG } from '../config/siteConfig'

/**
 * Footer — Bagian bawah penuh warna merah AGRES.ID.
 * Seluruh informasi kontak, alamat, dan tautan media sosial prodi dibaca
 * dari src/config/siteConfig.js (hanya bisa diedit lewat kode).
 */
function Footer() {
  const { brandName, tagline, description, contact, socialMedia, copyright } =
    SITE_CONFIG

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Kolom 1: Brand & Deskripsi */}
          <div className="footer-col">
            <div className="footer-brand-row">
              <div className="footer-logo-box">
                <Cpu size={20} color="#ec1c24" />
              </div>
              <div>
                <div className="footer-brand-name">{brandName}</div>
                <div className="footer-brand-sub">{tagline}</div>
              </div>
            </div>
            <p className="footer-desc">{description}</p>
          </div>

          {/* Kolom 2: Informasi Kontak Toko & Gudang */}
          <div className="footer-col">
            <h4 className="footer-heading">Informasi Kontak</h4>
            <ul className="footer-list">
              <li>
                <a
                  href={contact.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="footer-link"
                >
                  <MessageCircle size={14} /> WhatsApp: {contact.whatsapp}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="footer-link">
                  <Mail size={14} /> {contact.email}
                </a>
              </li>
              <li className="footer-info-item">
                <Phone size={14} /> {contact.phone}
              </li>
              <li className="footer-info-item">
                <Clock size={14} /> {contact.operationalHours}
              </li>
              <li className="footer-info-item">
                <MapPin size={14} /> {contact.address}
              </li>
            </ul>
          </div>

          {/* Kolom 3: Media Sosial Prodi */}
          <div className="footer-col">
            <h4 className="footer-heading">Media Sosial Prodi</h4>
            <ul className="footer-list">
              {socialMedia.map((sosmed) => (
                <li key={sosmed.id}>
                  <a
                    href={sosmed.url}
                    target="_blank"
                    rel="noreferrer"
                    className="footer-link"
                  >
                    <ExternalLink size={14} />
                    <span>
                      {sosmed.name} ({sosmed.handle})
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
