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
const [guestEmail, setGuestEmail] = useState('')
const [guestPhone, setGuestPhone] = useState('')
const [guests, setGuests] = useState([])
const [bookingStatus, setBookingStatus] = useState('idle')
const [bookingResult, setBookingResult] = useState(null)
const [bookingId, setBookingId] = useState('')
const [cancelStatus, setCancelStatus] = useState('idle')
const [cancelMessage, setCancelMessage] = useState('')
const [roomType, setRoomType] = useState('')
const [newBaseRate, setNewBaseRate] = useState('')
const [changedBy, setChangedBy] = useState('')
const [staffCode, setStaffCode] = useState('')
const [rateStatus, setRateStatus] = useState('idle')
const [rateResult, setRateResult] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    const today = new Date().toISOString().split('T')[0]

if (checkIn < today || checkOut <= checkIn) {
  setStatus('error')
  setMessage('Ngày nhận/trả phòng không hợp lệ.')
  return
}
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
  const addGuest = () => {
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      return
    }

    setGuests([
      ...guests,
      {
       guest_name: guestName,
email: guestEmail,
phone: guestPhone,
      },
    ])

    setGuestName('')
    setGuestEmail('')
    setGuestPhone('')
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
           email: guestEmail,
phone: guestPhone,
            check_in: checkIn,
            check_out: checkOut,
            guests: guests,
          }),
        }
      )

      const data = await response.json()
      if (data?.status === 'EXISTING_GUEST_CONFIRMATION_REQUIRED') {
  const useExisting = window.confirm(
    `${data.message}\n\nKhách hiện có: ${data.existing_guest?.guest_name}`
  )

  if (useExisting) {
    setBookingStatus('loading')

    const retryResponse = await fetch(
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
          email: guestEmail,
          phone: guestPhone,
          check_in: checkIn,
          check_out: checkOut,
          duplicate_choice: 'use_existing',
          existing_guest_id: data.existing_guest.guest_id,
          guests: guests,
        }),
      }
    )

    const retryData = await retryResponse.json()
    console.log('RETRY DATA:', retryData)

    if (!retryResponse.ok) {
      setBookingStatus('error')
      setBookingResult(retryData)
      return
    }

    setBookingStatus('success')
    setBookingResult(retryData)
    return
  }

  setBookingStatus('error')
  setBookingResult({
    error: 'Bạn chưa xác nhận sử dụng hồ sơ khách hiện có.',
  })
  return
}

      if (response.status === 409) {
        setBookingStatus('error')
        console.log('409 DATA:', data)
setBookingResult(data)
console.log('BOOKING RESULT:', data)
        return
      }

      if (!response.ok) {
        setBookingStatus('error')
        setBookingResult({ error: data.error || 'Không thể đặt phòng.' })
        return
      }
      

      setBookingStatus('success')
      setBookingResult(data)
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
      setCancelMessage(
        response.status === 404
          ? 'Không tìm thấy booking với mã này.'
          : data.error || 'Không thể hủy booking.'
      )
      return
    }

    setCancelStatus('success')
    setBookingId('')
  } catch (err) {
    setCancelStatus('error')
    setCancelMessage('Không kết nối được máy chủ.')
  }
}
  const handleUpdateRate = async (e) => {
  e.preventDefault()
  setRateStatus('loading')
  setRateResult(null)

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-base-rate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          room_type: roomType,
          new_base_rate: Number(newBaseRate),
          changed_by: changedBy,
          staff_code: staffCode,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      setRateStatus('error')
      setRateResult(data)
      return
    }

    setRateStatus('success')
    setRateResult(data)
  } catch (err) {
    setRateStatus('error')
    setRateResult({ error: 'Không kết nối được máy chủ.' })
  }
}
    return ( <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-logo">LV</div>
          <div>
            <h1>Lụa Vàng Resort & Spa</h1>
            <p>Central Reservation System</p>
          </div>
        </div>

        <nav>
          <a href="#search">Tìm phòng</a>
          <a href="#booking">Đặt phòng</a>
          <a href="#cancel">Hủy phòng</a>
          <a href="#rate-management">Quản lý giá</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">LỤA VÀNG RESORT & SPA</p>
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
    setBookingStatus('idle')
setBookingResult(null)
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
            <p>
  Nhận phòng: <strong>{checkIn}</strong> · Trả phòng: <strong>{checkOut}</strong>
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
                  
                />
              </div>
              <div className="form-group">
  <label htmlFor="guest-email">Email</label>
  <input
    id="guest-email"
    type="email"
    value={guestEmail}
    onChange={(e) => setGuestEmail(e.target.value)}
    placeholder="Nhập email"
    
  />
</div>

<div className="form-group">
  <label htmlFor="guest-phone">Số điện thoại</label>
  <input
    id="guest-phone"
    type="tel"
    pattern="[0-9]{9,11}"
    title="Số điện thoại gồm 9 đến 11 chữ số"
    value={guestPhone}
    onChange={(e) => setGuestPhone(e.target.value)}
    placeholder="Nhập số điện thoại"
    
  />
</div>
<button
  type="button"
  className="search-button"
  onClick={addGuest}
>
  + Thêm khách
</button>
{guests.length > 0 && (
  <div>
    <h3>Danh sách khách</h3>

    {guests.map((guest, index) => (
      <p key={index}>
        {index + 1}. {guest.guest_name} — {guest.phone} — {guest.email}
        <button
  type="button"
  onClick={() => {
    setGuests(guests.filter((_, i) => i !== index))
  }}
>
  Xóa
</button>
      </p>
    ))}
  </div>
)}
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
Mã booking: <strong>{bookingResult?.booking?.booking_id || bookingResult?.booking_id || bookingResult?.bookings?.[0]?.booking_id}</strong>

<br />
Phòng: <strong>{selectedRoom.room_id}</strong> – {selectedRoom.room_type}
<br />
Ngày: {checkIn} đến {checkOut}
<br />
Khách: {guests.map((guest, index) => (
  <span key={index}>
    {index > 0 ? ', ' : ''}
    {guest.guest_name}
  </span>
))}
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
<p>{cancelMessage}</p>
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
        <section className="search-card" id="rate-management">
  <div className="section-title">
    <p>QUẢN LÝ GIÁ</p>
    <h2>Cập nhật giá phòng</h2>
  </div>

  <form onSubmit={handleUpdateRate} className="search-form">
    <div className="form-group">
      <label htmlFor="room-type">Loại phòng</label>
      <input
        id="room-type"
        type="text"
        value={roomType}
        onChange={(e) => setRoomType(e.target.value)}
        placeholder="Ví dụ: Deluxe"
        required
      />
    </div>

    <div className="form-group">
      <label htmlFor="new-base-rate">Giá cơ bản mới</label>
      <input
        id="new-base-rate"
        type="number"
        min="0"
        value={newBaseRate}
        onChange={(e) => setNewBaseRate(e.target.value)}
        placeholder="Nhập giá mới"
        required
      />
    </div>

    <div className="form-group">
      <label htmlFor="changed-by">Người thay đổi</label>
      <input
        id="changed-by"
        type="text"
        value={changedBy}
        onChange={(e) => setChangedBy(e.target.value)}
        placeholder="Tên nhân viên"
        required
      />
    </div>

<div className="form-group">
  <label htmlFor="staff-code">Mã nhân viên</label>
  <input
    id="staff-code"
    type="password"
    value={staffCode}
    onChange={(e) => setStaffCode(e.target.value)}
    placeholder="Nhập mã nhân viên"
    required
  />
</div>
    <button
      type="submit"
      className="search-button"
      disabled={rateStatus === 'loading'}
    >
      {rateStatus === 'loading' ? 'Đang cập nhật...' : 'Cập nhật giá'}
    </button>
  </form>

  {rateStatus === 'success' && (
    <div>
      <p>Cập nhật giá thành công!</p>
      <p>
        Giá cũ: {rateResult?.result?.old_base_rate}
      </p>
      <p>
        Giá mới: {rateResult?.result?.new_base_rate}
      </p>
      <p>Giá theo từng kênh:</p>
      <table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
  <thead>
    <tr>
      <th style={{ border: '1px solid #ccc', padding: '8px 16px' }}>Kênh</th>
      <th style={{ border: '1px solid #ccc', padding: '8px 16px' }}>Giá</th>
    </tr>
  </thead>
  <tbody>
    {Object.entries(rateResult?.result?.channel_prices || {}).map(
      ([channel, price]) => (
        <tr key={channel}>
          <td style={{ border: '1px solid #ccc', padding: '8px 16px' }}>
            {channel}
          </td>
          <td style={{ border: '1px solid #ccc', padding: '8px 16px' }}>
            {Number(price).toLocaleString('vi-VN')}
          </td>
        </tr>
      )
    )}
  </tbody>
</table>
    </div>
  )}

  {rateStatus === 'error' && (
    <p>
      {rateResult?.error || 'Không thể cập nhật giá.'}
    </p>
  )}
</section>
      </main>

      <footer>
     <p>© 2026 Lụa Vàng Resort & Spa — Central Reservation System</p>
      </footer>
    </div>
  )
}

export default App