/* Подключение облачной базы данных (Supabase). Инструкция: SETUP-SUPABASE.txt.
   Пока url и key пустые, приложение работает без базы: профили хранятся только на самом устройстве.
   Ключ «anon / publishable» публичный, его можно хранить в коде. Ключ «service_role» сюда вставлять НЕЛЬЗЯ. */
window.RK_CLOUD = window.RK_CLOUD || {
    url: 'https://ivhbznsyiezvjuokbvtm.supabase.co',
    key: 'sb_publishable_e4i2UQu9a7MgxBo_r3-BBQ_vD-O4TW2',
    emailDomain: 'gmail.com'
};