/**
 * AIX/UNETI12 browser inference: numeric LightGBM trees exported from the
 * verified Python LightGBM model (2394 trees). No hardcoded trip predictions.
 * Reimplements UNETI12_PREPROCESS/02_feature_engineering.py, including f32
 * rounding of all 45 features before decision-tree comparisons.
 */
export const INPUT_NAMES = [
  'vendor_id','passenger_count','pickup_month','pickup_dayofweek',
  'pickup_hour','pickup_minute_bucket','pickup_lon_approx','pickup_lat_approx',
  'dropoff_lon_approx','dropoff_lat_approx','straight_line_km_approx','store_and_fwd_flag'
];

const PI = Math.PI;
const f = Math.fround;

export function validateTrip(input) {
  const error = (msg) => { throw new Error(msg); };
  const categories = {
    vendor_id: [1, 2], pickup_month: [1,2,3,4,5,6],
    pickup_dayofweek: [0,1,2,3,4,5,6], pickup_minute_bucket: [0,15,30,45]
  };
  for (const field of INPUT_NAMES) {
    if (input[field] === '' || input[field] === undefined || input[field] === null) {
      error(`Vui lòng nhập trường ${field}.`);
    }
    if (field !== 'store_and_fwd_flag' && !Number.isFinite(Number(input[field]))) {
      error(`${field} phải là một số hữu hạn.`);
    }
  }
  for (const [key, allowed] of Object.entries(categories)) {
    if (!allowed.includes(Number(input[key]))) error(`${key}: giá trị nằm ngoài danh sách hợp lệ.`);
  }
  const integerFields = ['passenger_count','pickup_hour'];
  for (const key of integerFields) if (!Number.isInteger(Number(input[key]))) error(`${key} phải là số nguyên.`);
  const hour = Number(input.pickup_hour), passengers = Number(input.passenger_count);
  if (hour < 0 || hour > 23) error('Giờ đón khách phải thuộc 0–23.');
  if (passengers < 1 || passengers > 6) error('Số hành khách phải thuộc 1–6.');
  if (!['N','Y'].includes(input.store_and_fwd_flag)) error('Cờ lưu/đồng bộ chỉ được chọn N hoặc Y.');
  if (Number(input.straight_line_km_approx) < 0) error('Khoảng cách không được âm.');
  for (const key of ['pickup_lon_approx','dropoff_lon_approx']) {
    if (Number(input[key]) < -75 || Number(input[key]) > -72) error('Kinh độ phải trong khoảng -75 đến -72.');
  }
  for (const key of ['pickup_lat_approx','dropoff_lat_approx']) {
    if (Number(input[key]) < 39.5 || Number(input[key]) > 41.5) error('Vĩ độ phải trong khoảng 39,5 đến 41,5.');
  }
  return input;
}

export function haversineKm(lon1, lat1, lon2, lat2) {
  const rad = x => x * PI / 180;
  const la1 = rad(Number(lat1)), la2 = rad(Number(lat2));
  const dlat = la2 - la1, dlon = rad(Number(lon2) - Number(lon1));
  const a = Math.min(1,Math.max(0,Math.sin(dlat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dlon/2)**2));
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a));
}

export function buildFeatures(input) {
  validateTrip(input);
  const v = (key) => Number(input[key]);
  const month=v('pickup_month'),day=v('pickup_dayofweek'),hour=v('pickup_hour'),minute=v('pickup_minute_bucket');
  const dist=v('straight_line_km_approx');
  const lon1=v('pickup_lon_approx'),lat1=v('pickup_lat_approx');
  const lon2=v('dropoff_lon_approx'),lat2=v('dropoff_lat_approx');
  const time = hour + minute / 60;
  const timeAngle=2*PI*time/24;
  const dayAngle=2*PI*day/7;
  const haversine = haversineKm(lon1,lat1,lon2,lat2);
  const dx=(lon2-lon1)*111.32*Math.cos(((lat1+lat2)/2)*PI/180);
  const dy=(lat2-lat1)*111.32;
  const norm=Math.hypot(dx,dy);
  const features=[
    month,day,hour,minute,v('passenger_count'),lon1,lat1,lon2,lat2,dist,
    +(v('vendor_id')===1),+(v('vendor_id')===2),+(input.store_and_fwd_flag==='Y'),
    ...[1,2,3,4,5,6].map(m=>+(m===month)),
    ...[0,1,2,3,4,5,6].map(d=>+(d===day)),
    time, Math.sin(timeAngle),Math.cos(timeAngle),Math.sin(dayAngle),Math.cos(dayAngle),
    lon2-lon1,lat2-lat1,dx,dy,Math.abs(dx)+Math.abs(dy),haversine,
    norm>1e-9?dx/norm:0,norm>1e-9?dy/norm:0,
    dist-haversine,Math.log1p(dist),+(norm<1e-9),+(dist===0),
    dist*Math.sin(timeAngle),dist*Math.cos(timeAngle)
  ].map(f);
  if (features.length!==45 || features.some(x=>!Number.isFinite(x))) {
    throw new Error('Không thể tạo 45 đặc trưng hợp lệ.');
  }
  return features;
}

export function predictTrip(input, model) {
  if (!model || model.export_version!==1 || model.tree_count!==2394 || model.feature_names.length!==45) {
    throw new Error('Chưa tải được mô hình LightGBM hợp lệ.');
  }
  const x=buildFeatures(input);
  let raw=0;
  for (const tree of model.trees) {
    let index=0;
    while (true) {
      const node=tree[index];
      if (node.length===1) { raw+=node[0]; break; }
      index=x[node[0]]<=node[1]?node[2]:node[3];
    }
  }
  const seconds=Math.max(Math.expm1(Math.min(20,Math.max(0,raw))),1e-3);
  if (!Number.isFinite(seconds)||seconds<=0) throw new Error('Dự đoán không hợp lệ.');
  return seconds;
}
