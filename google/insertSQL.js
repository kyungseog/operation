module.exports.insertSql = {
    korea_rate: `
    INSERT INTO management.exchange_rate
      (created_at
      , usd
      , jpy) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      usd=values(usd)
      , jpy=values(jpy)`,

    marketing_meta : `
    INSERT INTO management.korea_marketing_meta 
      (id
      , name
      , cost
      , cpc
      , ctr
      , exposure
      , reach
      , click
      , conversion
      , roas
      , brand_id
      , start_date
      , end_date) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      name=values(name)
      , cost=values(cost)
      , cpc=values(cpc)
      , ctr=values(ctr)
      , exposure=values(exposure)
      , reach=values(reach)
      , click=values(click)
      , conversion=values(conversion)
      , roas=values(roas)
      , brand_id=values(brand_id)
      , start_date=values(start_date)
      , end_date=values(end_date)`
}