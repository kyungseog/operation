module.exports.insertSql = {
    exchange_rate: `
    INSERT INTO management.exchange_rate
      (created_at
      , usd
      , jpy) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      usd=values(usd)
      , jpy=values(jpy)`,
    
    suppliers: `
    INSERT INTO management.suppliers
      (id
      , integration_name
      , name
      , status_id) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      integration_name=values(integration_name)
      , name=values(name)
      , status_id=values(status_id)`,

    brands: `
    INSERT INTO management.brands
      (id
      , name
      , type
      , squad
      , manager_id
      , supplier_id
      , commission
      , created_at
      , status_id) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      name=VALUES(name)
      , type=VALUES(type)
      , squad=VALUES(squad)
      , manager_id=VALUES(manager_id)
      , supplier_id=VALUES(supplier_id)
      , commission=VALUES(commission)
      , created_at=VALUES(created_at)
      , status_id=VALUES(status_id)`,

    korea_users: `
    INSERT INTO management.korea_users
      (id
      , created_at
      , updated_at) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      created_at=VALUES(created_at)
      , updated_at=updated_at`,

    live_commerces: `
    INSERT INTO management.live_commerces
      (id
      , campaign_key
      , name
      , brand_id
      , event_sno
      , start_date
      , end_date) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      campaign_key=values(campaign_key)
      , name=values(name)
      , brand_id=values(brand_id)
      , event_sno=values(event_sno)
      , start_date=values(start_date)
      , end_date=values(end_date)`,

    stocks: `
    INSERT INTO management.stocks
      (seller_name
      , seller_id
      , custom_product_id
      , barcode
      , custom_variant_id
      , product_name
      , option_name
      , quantity
      , non_delivery_order
      , usable_quantity
      , cost
      , total_cost) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      seller_name=values(seller_name)
      ,seller_id=values(seller_id)
      ,custom_product_id=values(custom_product_id)
      ,custom_variant_id=values(custom_variant_id)
      ,product_name=values(product_name)
      ,option_name=values(option_name)
      ,quantity=values(quantity)
      ,non_delivery_order=values(non_delivery_order)
      ,usable_quantity=values(usable_quantity)
      ,cost=values(cost)
      ,total_cost=values(total_cost)`,

    cost_ids: `
    INSERT INTO management.cost_ids
      (barcode
      , custom_variant_id
      , product_variant_id
      , id) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      custom_variant_id=values(custom_variant_id)
      , product_variant_id=values(product_variant_id)
      , id=values(id)`,

    costs: `
    INSERT INTO management.costs
      (issued_at
      , id
      , cost) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      cost=values(cost)`,

    marketing : `
    INSERT INTO management.korea_marketing 
      (id
      , channel
      , created_date
      , name
      , cost
      , click
      , exposure
      , conversion
      , brand_id) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      channel=values(channel)
      , created_date=values(created_date)
      , name=values(name)
      , cost=values(cost)
      , click=values(click)
      , exposure=values(exposure)
      , conversion=values(conversion)
      , brand_id=values(brand_id)`
}
