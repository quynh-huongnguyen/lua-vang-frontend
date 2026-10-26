import { useState } from 'react'
import './App.css'

function App() {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [rooms, setRooms] = useState([])
const [status, setStatus] = useState('idle')
const [message, setMessage] = useState('')
const [selectedRoom, setSelectedRoom] = useState(null)
const [guestName, setGuestName] = useState('')
const [bookingStatus, setBookingStatus] = useState('idle')
const [bookingResult, setBookingResult] = useState(null)
const [bookingId, setBookingId] = useState('')
const [cancelStatus, setCancelStatus] = useState('idle')

  const handleSearch = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    setRooms([])

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check_availability`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ check_in: checkIn, check_out: checkOut }),
        }
      )

      const data = await response.json()
      console.log('BOOKING RESPONSE:', data)
      

      if (!response.ok) {
        setStatus('error')
        setMessage(data.error || 'Có lỗi xảy ra, vui lòng thử lại.')
        return
      }

      setRooms(data.rooms)
      setStatus(data.total_available > 0 ? 'success' : 'empty')
      
    } catch (err) {
      setStatus('error')
      setMessage('Không kết nối được máy chủ.')
    }
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    setBookingStatus('loading')
    setBookingResult(null)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_booking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            room_id: selectedRoom.room_id,
            guest_name: guestName,
            check_in: checkIn,
            check_out: checkOut,
          }),
        }
      )

      const data = await response.json()

      if (response.status === 409) {
        setBookingStatus('conflict')
        return
      }

      if (!response.ok) {
        setBookingStatus('error')
        setBookingResult({ error: data.error || 'Không thể đặt phòng.' })
        return
      }
      

      setBookingStatus('success')
      setBookingResult(data)
      setBookingId(data.booking_id)
    } catch (err) {
      setBookingStatus('error')
      setBookingResult({ error: 'Không kết nối được máy chủ.' })
    }
  }
    const handleCancel = async (e) => {
    e.preventDefault()
    setCancelStatus('loading')

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel_booking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            booking_id: bookingId,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setCancelStatus('error')
        return
      }

      setCancelStatus('success')
      setBookingId('')
      
    } catch (err) {
      setCancelStatus('error')
    }
  }
    return ( <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-logo">LV</div>
          <div>
            <h1>Lúa Vàng Resort</h1>
            <p>Central Reservation System</p>
          </div>
        </div>

        <nav>
          <a href="#search">Tìm phòng</a>
          <a href="#booking">Đặt phòng</a>
          <a href="#cancel">Hủy phòng</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">LÚA VÀNG RESORT</p>
            <h2>Đặt kỳ nghỉ của bạn</h2>
            <p className="hero-text">
              Tìm phòng trống, đặt phòng và quản lý booking
              một cách nhanh chóng.
            </p>
          </div>
        </section>

        <section className="search-card" id="search">
          <div className="section-title">
            <p>TÌM PHÒNG</p>
            <h2>Kiểm tra phòng còn trống</h2>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <div className="form-group">
              <label htmlFor="check-in">Ngày nhận phòng</label>
              <input
                id="check-in"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="check-out">Ngày trả phòng</label>
              <input
                id="check-out"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="search-button">
              Tìm phòng
            </button>
          </form>
        </section>

        <section className="results">
          {status === 'loading' && <p>Đang tìm phòng...</p>}
          {status === 'empty' && (
            <p>Không có phòng trống trong khoảng thời gian này.</p>
          )}
          {status === 'error' && <p>{message}</p>}
          {rooms.map((room) => (
            <div key={room.room_id}>
              <h3>{room.room_id} – {room.room_type}</h3>
              <p>Sức chứa: {room.capacity} người · {room.size_sqm} m²</p>
              <p>Giá: {room.rate_low} – {room.rate_high}</p>
              <button
  type="button"
  onClick={() => {
    setSelectedRoom(room)
    setTimeout(() => {
      document.getElementById('booking')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }}
>
  Đặt phòng
</button>
            </div>
          ))}
        </section>
                {selectedRoom && (
          <section className="search-card" id="booking">
            <div className="section-title">
              <p>ĐẶT PHÒNG</p>
              <h2>Thông tin đặt phòng</h2>
            </div>

            <p>
              Phòng đã chọn: <strong>{selectedRoom.room_id}</strong> –{' '}
              {selectedRoom.room_type}
            </p>

            <form onSubmit={handleBooking} className="search-form">
              <div className="form-group">
                <label htmlFor="guest-name">Tên khách</label>
                <input
                  id="guest-name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nhập tên khách"
                  required
                />
              </div>

              <button
                type="submit"
                className="search-button"
                disabled={bookingStatus === 'loading'}
              >
                {bookingStatus === 'loading'
                  ? 'Đang đặt phòng...'
                  : 'Xác nhận đặt phòng'}
              </button>
            </form>

            {bookingStatus === 'conflict' && (
              <p>Phòng này vừa được người khác đặt. Vui lòng chọn phòng khác.</p>
            )}

            {bookingStatus === 'error' && (
              <p>{bookingResult?.error || 'Không thể đặt phòng.'}</p>
            )}

           {bookingStatus === 'success' && (
  <p>
    Đặt phòng thành công!
    <br />
Mã booking: <strong>{bookingResult?.booking?.booking_id}</strong>
  </p>
)}
          </section>
        )}
                <section className="search-card" id="cancel">
          <div className="section-title">
            <p>HỦY PHÒNG</p>
            <h2>Quản lý booking</h2>
          </div>

          <p>Nhập mã booking để hủy phòng.</p>

          <form onSubmit={handleCancel} className="search-form">
            <div className="form-group">
              <label htmlFor="booking-id">Mã booking</label>
             <input
  id="booking-id"
  type="text"
  value={bookingId}
  onChange={(e) => setBookingId(e.target.value)}
  placeholder="Nhập mã booking"
/>
            </div>

            <button type="submit" className="search-button">
              Hủy phòng
            </button>
            {cancelStatus === 'success' && (
  <p>Hủy phòng thành công!</p>
)}

{cancelStatus === 'error' && (
  <p>Không thể hủy booking. Vui lòng kiểm tra lại mã booking.</p>
)}
          </form>
        </section>
        <section className="info-section">
          <div className="info-card">
            <span>01</span>
            <h3>Tìm phòng</h3>
            <p>Chọn ngày nhận và trả phòng để kiểm tra phòng còn trống.</p>
          </div>

          <div className="info-card">
            <span>02</span>
            <h3>Đặt phòng</h3>
            <p>Chọn phòng phù hợp và nhập thông tin khách lưu trú.</p>
          </div>

          <div className="info-card">
            <span>03</span>
            <h3>Quản lý booking</h3>
            <p>Tra cứu và hủy booking khi cần thiết.</p>
          </div>
        </section>
      </main>

      <footer>
        <p>© 2026 Lúa Vàng Resort — Central Reservation System</p>
      </footer>
    </div>
  )
}

export default App