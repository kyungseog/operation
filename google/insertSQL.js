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
      , integration_id
      , integration_name
      , supplier_name
      , ceo
      , registration_id
      , account_type
      , tax_type
      , account_count
      , bank_name
      , bank_account
      , account_owner
      , account_email
      , status_id) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      integration_id=values(integration_id)
      , integration_name=values(integration_name)
      , supplier_name=values(supplier_name)
      , ceo=values(ceo)
      , registration_id=values(registration_id)
      , account_type=values(account_type)
      , tax_type=values(tax_type)
      , account_count=values(account_count)
      , bank_name=values(bank_name)
      , bank_account=values(bank_account)
      , account_owner=values(account_owner)
      , account_email=values(account_email)
      , status_id=values(status_id)`,

  brands: `
    INSERT INTO management.brands
      (id
      , brand_name
      , account_type
      , design_type
      , sales_country
      , squad
      , manager_id
      , supplier_id
      , supplier_md_email
      , commission
      , created_at
      , deleted_at
      , status_id) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      brand_name=VALUES(brand_name)
      , account_type=VALUES(account_type)
      , design_type=VALUES(design_type)
      , sales_country=VALUES(sales_country)
      , squad=VALUES(squad)
      , manager_id=VALUES(manager_id)
      , supplier_id=VALUES(supplier_id)
      , supplier_md_email=VALUES(supplier_md_email)
      , commission=VALUES(commission)
      , created_at=VALUES(created_at)
      , deleted_at=VALUES(deleted_at)
      , status_id=VALUES(status_id)`,

  korea_users: `
    INSERT INTO management.korea_users
      (id
      , created_at
      , updated_at
      , user_birthday
      , first_child_birthday
      , second_child_birthday
      , cellphone) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      created_at=VALUES(created_at)
      , updated_at=updated_at
      , user_birthday=VALUES(user_birthday)
      , first_child_birthday=VALUES(first_child_birthday)
      , second_child_birthday=VALUES(second_child_birthday)
      , cellphone=VALUES(cellphone)`,

  korea_lives: `
    INSERT INTO management.korea_lives
      (id
      , campaign_key
      , live_name
      , brand_id
      , live_page_sno
      , brand_page_sno
      , cost
      , start_date
      , end_date) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      campaign_key=values(campaign_key)
      , live_name=values(live_name)
      , brand_id=values(brand_id)
      , live_page_sno=values(live_page_sno)
      , brand_page_sno=values(brand_page_sno)
      , cost=values(cost)
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

  costs: `
    INSERT INTO management.costs
      (product_id
      , product_variant_id
      , custom_variant_id
      , cost) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      product_id=values(product_id)
      , custom_variant_id=values(custom_variant_id)
      , cost=values(cost)`,

  marketing: `
    INSERT INTO management.korea_marketing 
      (id
      , channel
      , created_at
      , name
      , cost
      , click
      , exposure
      , conversion
      , brand_id
      , sno_no) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
      channel=values(channel)
      , created_at=values(created_at)
      , name=values(name)
      , cost=values(cost)
      , click=values(click)
      , exposure=values(exposure)
      , conversion=values(conversion)
      , brand_id=values(brand_id)
      , sno_no=values(sno_no)`,

  product_essentials_sales: `
    INSERT INTO management.product_essentials_sales
      (product_id
      , product_variant_id
      , custom_variant_id
      , variant_cost
      , product_name
      , barcode) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
    custom_variant_id=values(custom_variant_id)
      ,variant_cost=values(variant_cost)
      ,product_name=values(product_name)`,

  product_essentials_production: `
      INSERT INTO management.product_essentials_production
        (barcode
        , custom_variant_id
        , custom_cost_id
        , pre_cost
        , post_cost
        , in_quantity
        , color
        , size
        , age
        , category
        , plan_year
        , season
        , material
        ,first_sale_date) 
      VALUES ? 
      ON DUPLICATE KEY UPDATE 
      custom_variant_id=values(custom_variant_id)
        ,custom_cost_id=values(custom_cost_id)
        ,pre_cost=values(pre_cost)
        ,post_cost=values(post_cost)
        ,in_quantity=values(in_quantity)
        ,color=values(color)
        ,size=values(size)
        ,age=values(age)
        ,category=values(category)
        ,plan_year=values(plan_year)
        ,season=values(season)
        ,material=values(material)
        ,first_sale_date=values(first_sale_date)`,
};
