CREATE OR REPLACE FUNCTION approve_listing(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE vendor_store_items
  SET status = 'active', published_at = NOW(), expires_at = NOW() + INTERVAL '30 days'
  WHERE id = listing_id;
  UPDATE vendor_profiles vp
  SET ads_used_month = ads_used_month + 1
  FROM vendor_store_items vsi
  WHERE vsi.id = listing_id AND vp.id = vsi.vendor_id;
END;
$$ LANGUAGE plpgsql;
