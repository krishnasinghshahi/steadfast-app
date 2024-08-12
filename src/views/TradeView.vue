<template>
  <!-- Brokers, Broker Status, Total Funds, Utilized Margin & Today's Date -->
  <section class="row pb-3">
    <div class="col-12">

      <div class="row">

        <!-- Change Broker -->
        <div class="col-2">
          <label for="ChangeBroker" class="form-label mb-1"><b>Change Broker</b></label>
          <div class="d-flex align-items-center">
            <select class="form-select" id="ChangeBroker" aria-label="Change Broker" v-model="selectedBrokerName"
              @change="updateSelectedBroker">
              <option value="" disabled selected>Select a broker</option>
              <option v-for="brokerName in availableBrokers" :key="brokerName" :value="brokerName">
                {{ brokerName }}
              </option>
            </select>
          </div>
        </div>

        <!-- Broker Name and Status with Broker ID -->
        <div class="col-3 text-center">
          <p class="mb-1">
            <b>Status: </b>
            <span :class="{
              'badge bg-success': brokerStatus === 'Connected',
              'badge bg-danger': brokerStatus === 'Not Connected',
              'badge bg-warning text-dark': brokerStatus === 'Token Expired'
            }">
              {{ brokerStatus }}
            </span>
          </p>
          <p class="mb-0 d-flex align-items-center justify-content-center">
            <RouterLink class="fs-4 text-decoration-none me-2" to="/manage-brokers">
              <span>⚙️</span>
            </RouterLink>
            <span v-if="showBrokerClientId" @click="toggleBrokerClientIdVisibility">
              {{ selectedBroker?.clientId || 'N/A' }}
              <span>👀</span>
            </span>
            <span v-else @click="toggleBrokerClientIdVisibility">
              {{ maskBrokerClientId(selectedBroker?.clientId) }}
              <span>👁️</span>
            </span>
          </p>
        </div>

        <!-- Total Funds -->
        <div class="col-3 text-center">
          <p class="mb-1"><b>Total Funds</b></p>
          <p class="mt-2 mb-0">
            ₹ {{ availableBalance !== null ? availableBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 }) :
              'N/A' }}
          </p>
        </div>

        <!-- Utilized Margin -->
        <div class="col-2 text-center">
          <p class="mb-1"><b>Utilized Margin</b></p>
          <p class="mt-2 mb-0">₹ {{ usedAmount || null }}</p>
        </div>

        <!-- Today's Expiry -->
        <div class="col-2 text-end">
          <p class="mb-1"><b>Today's Expiry</b></p>
          <p v-if="isExpiryToday" class="text-danger">
            <b>{{ selectedMasterSymbol }}</b>
          </p>
          <p v-else class="text-danger">
            <b>-</b>
          </p>
        </div>

      </div>

    </div>
  </section>
  <!-- <section class="row py-3">
    <div class="col-12">
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="toggleLineChart" v-model="showLineChart">
        <label class="form-check-label" for="toggleLineChart">
          Show MTM Chart
        </label>
      </div>
      <LineChart v-if="showLineChart" :profitData="profitData" />
    </div>
  </section> -->

  <!-- Total Profit & Net PNL -->
  <section class="row py-3">
    <div class="col-5">
      <div class="Card">
        <blockquote class="fs-3"
          :class="totalProfit > 0 ? 'text-success' : totalProfit < 0 ? 'text-danger' : 'text-dark'">
          ₹ {{ totalProfit.toFixed(2) }}
        </blockquote>
        <small>
          <span :class="netPnl > 0 ? 'text-success' : netPnl < 0 ? 'text-danger' : 'text-dark'">
            ₹ {{ netPnl.toFixed(2) }}
          </span>
          Estimated (after all charges)
        </small>
      </div>
    </div>
    <div class="col-4">
      <div class="Card">
        <blockquote class="fs-3 text-center m-0">
          <span
            :class="totalCapitalPercentage > 0 ? 'text-success' : totalCapitalPercentage < 0 ? 'text-danger' : 'text-dark'">
            {{ totalCapitalPercentage.toFixed(2) }}%
          </span>
          <br />
          <small> on Total Capital</small>
        </blockquote>
        <small v-if="totalNetQty !== 0">{{ deployedCapitalPercentage.toFixed(2) }}% on Deployed Capital</small>
      </div>
    </div>
    <div class="col-3 d-flex justify-content-center align-items-center">
      <div class="Card">
        <div class="card-title">
          <h5>Kill Switch</h5>
        </div>
        <button :class="killSwitchButtonClass" @click="handleKillSwitchClick"
          :data-bs-target="killSwitchActive ? '' : '#KillSwitchActivationConfirmationModal'"
          :data-bs-toggle="killSwitchActive ? '' : 'modal'">
          {{ killSwitchButtonText }} <span v-if="killSwitchActive">{{ currentClockEmoji }}</span>
        </button>
      </div>
    </div>
  </section>

  <section class="row py-1">
    <div class="col-12" v-if="killSwitchActive">
      <div class="bg-danger text-white p-3 rounded-3 shadow">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <h5 class="mb-2">Kill Switch Activated</h5>
            <p class="mb-0">
              Trading has been blocked for the next 6 hours. Take a break to put your mind at ease.
            </p>
          </div>
          <div class="text-center">
            <span class="bg-white text-dark py-2 px-3 rounded-2 fs-4 fw-bold">
              {{ killSwitchRemainingTime }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <hr />

  <!-- Place Order Form -->
  <section class="row py-2">
    <form @submit.prevent>
      <fieldset :disabled="isFormDisabled" :class="{ 'disabled-form': isFormDisabled }">
        <div class="row">
          <!-- Exchange Selection -->
          <div class="col-2">
            <label for="Exchange" class="form-label mb-0">Exchange</label>
            <select id="Exchange" class="form-select" aria-label="Exchange" v-model="selectedExchange"
              @change="fetchTradingData" :class="{ 'disabled-form': isFormDisabled }">
              <option v-for="exchange in exchangeOptions" :key="exchange" :value="exchange">
                {{ exchange }}
              </option>
            </select>
          </div>

          <!-- Segment Selection -->
          <div class="col-2">
            <label for="Segment" class="form-label mb-0">Segment</label>
            <select id="Segment" class="form-select" aria-label="Segment" :class="{ 'disabled-form': isFormDisabled }"
              disabled>
              <option value="Options" selected>Options</option>
              <option value="Futures">Futures</option>
            </select>
          </div>

          <!-- Master Symbol Selection -->
          <div class="col-2">
            <label for="MasterSymbol" class="form-label mb-0">Master Symbol</label>
            <select id="MasterSymbol" class="form-select" aria-label="Master Symbol" v-model="selectedMasterSymbol"
              @change="fetchTradingData" :class="{ 'disabled-form': isFormDisabled }">
              <option v-for="symbol in exchangeSymbols[selectedExchange]" :key="symbol" :value="symbol">{{
                symbol }}
              </option>
            </select>
          </div>

          <!-- Expiry Date Selection -->
          <div class="col-2">
            <label for="Expiry" class="form-label mb-0">Expiry Date</label>
            <select id="Expiry" class="form-select" aria-label="Expiry" v-model="selectedExpiry"
              :class="{ 'disabled-form': isFormDisabled }">
              <option v-for="date in expiryDates" :key="date" :value="date">
                {{ formatDate(date) }}
              </option>
            </select>
          </div>

          <!-- Product Type Selection -->
          <div class="col-2">
            <label for="ProductType" class="form-label mb-0">Product Type</label>
            <select id="ProductType" class="form-select" v-model="selectedProductType" aria-label="ProductType"
              :class="{ 'disabled-form': isFormDisabled }">
              <option v-for="productType in productTypes" :key="productType" :value="getProductTypeValue(productType)">
                {{ productType }}
              </option>
            </select>
          </div>

          <!-- Quantity Selection -->
          <div class="col-2">
            <label for="Quantity" class="form-label mb-0">
              {{ selectedLots }} Lot{{ selectedLots !== 1 ? 's' : '' }} / Quantity
            </label>
            <div class="input-group">
              <input type="number" id="Quantity" class="form-control" v-model.number="selectedLots" :min="1"
                :max="maxLots" @input="updateSelectedQuantity" :class="{ 'disabled-form': isFormDisabled }">
              <span class="input-group-text">{{ selectedQuantity }}</span>
            </div>
          </div>
        </div>

        <div class="row mt-3">
          <!-- Order Type -->
          <div class="col-3">
            <label for="OrderType" class="form-label mb-0">Order Type</label>
            <div class="input-group">
              <select id="OrderType" class="form-select w-50" aria-label="OrderType" v-model="selectedOrderType"
                :class="{ 'disabled-form': isFormDisabled }">
                <option v-for="orderType in orderTypes" :key="orderType" :value="orderType">{{ orderType }}
                </option>
              </select>
              <span class="input-group-text p-0 w-50" v-if="selectedOrderType === 'LMT'">
                <input type="number" id="NorenDirectLimitPrice" class="form-control" v-model="limitPrice"
                  placeholder="Price" style="font-size: 16px;">
              </span>
              <span class="input-group-text p-0 w-50" v-if="selectedOrderType === 'LIMIT'">
                <input type="number" id="DhanLimitPrice" class="form-control" v-model="limitPrice"
                  placeholder="Price" style="font-size: 16px;">
              </span>              
              <span class="input-group-text p-0 w-50" v-if="selectedOrderType === 'SL-LMT'">
                <input type="number" id="TriggerPrice" class="form-control" v-model="triggerPrice" 
                  placeholder="Trigger Price" style="font-size: 12px;">
                <input type="number" id="NorenStopLossLimitPrice" class="form-control" 
                  v-model="stopLossLimitPrice" placeholder="Price" style="font-size: 12px;">
              </span>
              <span class="input-group-text p-0 w-50" v-if="selectedOrderType === 'STOP_LOSS'">
                <input type="number" id="TriggerPrice" class="form-control" v-model="triggerPrice" 
                  placeholder="Trigger Price" style="font-size: 12px;">
                <input type="number" id="DhanStopLossLimitPrice" class="form-control" 
                  v-model="stopLossLimitPrice" placeholder="Price" style="font-size: 12px;">
              </span>
            </div>
          </div>
          <!-- Market Protection Order %-->
          <div class="col-2">
            <label for="MarketProtection" class="form-label mb-0">Market Protection</label>
            <select id="MarketProtection" class="form-select" 
              v-model="marketProtectionPercentage"
              :disabled="isMarketProtectionDisabled || !isMarketAsLimitOrder">
              <option value="0">0%</option>
              <option value="1">1%</option>
              <option value="2">2%</option>
              <option value="3">3%</option>
              <option value="4">4%</option>
              <option value="5">5%</option>
              <option value="6">6%</option>
              <option value="7">7%</option>
              <option value="8">8%</option>
              <option value="9">9%</option>
              <option value="10">10%</option>
            </select>
          </div> 
         <!-- Stoploss -->
          <div class="col-2">
            <label for="enableStoploss" class="form-label mb-0">Stoploss</label>
            <div class="input-group mb-3">
              <div class="input-group-text">
                <input class="form-check-input mt-0" type="checkbox" id="enableStoploss"
                  v-model="tradeSettings.enableStoploss" aria-label="Enable Stoploss"
                  :class="{ 'disabled-form': isFormDisabled }">
              </div>
              <input type="number" class="form-control" id="stoplossValue" v-model.number="tradeSettings.stoplossValue"
                aria-label="Stoploss (points)" :class="{ 'disabled-form': isFormDisabled }">

            </div>
          </div>
          <!-- Target -->
          <div class="col-2">
            <label for="enableTarget" class="form-label mb-0">Target</label>
            <div class="input-group mb-3">
              <div class="input-group-text">
                <input class="form-check-input mt-0" type="checkbox" id="enableTarget"
                  v-model="tradeSettings.enableTarget" aria-label="Enable Target"
                  :class="{ 'disabled-form': isFormDisabled }">
              </div>
              <input type="number" class="form-control" id="targetValue" v-model.number="tradeSettings.targetValue"
                aria-label="Target (points)" :class="{ 'disabled-form': isFormDisabled }">
            </div>
          </div>
          <!-- 1 Click Keys -->
          <div class="col-3">
            <div class="d-flex align-items-center float-end h-100">
              <label class="ToggleSwitch">
                <input class="ToggleInput" type="checkbox" id="enableHotKeys" v-model="enableHotKeys"
                  :class="{ 'disabled-form': isFormDisabled }">
                <span class="ToggleSlider SliderRound" :class="{ 'disabled-form': isFormDisabled }"></span>
              </label>
              <label class="ToggleLabel" for="enableHotKeys" :class="{ 'disabled-form': isFormDisabled }"><b> 1 Click
                  <br /> Keys ⌨️</b></label>
            </div>
          </div>
        </div>

        <!-- Trading Symbols & Strikes -->
        <div class="row align-items-center justify-content-between">
          <!-- Call Strike Selection -->
          <div class="col-3">
            <label for="CallStrike" class="form-label mb-0 d-flex flex-row justify-content-between">
              <span>Call Strike</span>
              <span class="me-4">LTP</span>
            </label>
            <div class="input-group">
              <select id="CallStrike" class="form-select" aria-label="Call Strike" v-model="selectedCallStrike"
                :class="{ 'disabled-form': isFormDisabled }">
                <option v-for="strike in callStrikes" :key="strike.securityId" :value="strike">
                  {{ strike.strikePrice }}
                </option>
              </select>
              <span class="input-group-text">{{ latestCallLTP }}</span>
            </div>
            <!-- DO NOT REMOVE, USEFUL FOR DEBUGGING -->
            <!-- <div>
              Security ID: {{ defaultCallSecurityId }}
            </div> -->
            <div class="mt-2">
              {{ selectedCallStrike.tradingSymbol }}
            </div>
          </div>

          <!-- Live Underlying Price -->
          <div class="col-6 text-center">
            <p class="mb-0" v-if="selectedMasterSymbol === 'NIFTY'">Nifty 50: <b>{{ niftyPrice }} ( {{ niftyPriceChange }})%</b></p>
            <p class="mb-0" v-if="selectedMasterSymbol === 'BANKNIFTY'">Bank Nifty: <b>{{ bankNiftyPrice }} ({{ bankNiftyPriceChange }})%</b></p>
            <p class="mb-0" v-if="selectedMasterSymbol === 'FINNIFTY'">Fin Nifty: <b>{{ finniftyPrice }} ({{ finniftyPriceChange }})%</b></p>
            <p class="mb-0" v-if="selectedMasterSymbol === 'NIFTYNXT50'">Nifty Next 50: <b>{{ niftynxt50Price }} ({{ niftynxt50PriceChange }})%</b></p>
            <p class="mb-0" v-if="selectedMasterSymbol === 'MIDCPNIFTY'">Nifty Mid Select: <b>{{ midcpniftyPrice }} ({{ midcpniftyPriceChange }})%</b>
            </p>
            <p class="mb-0" v-if="selectedMasterSymbol === 'SENSEX'">Sensex: <b>{{ sensexPrice }} ({{ sensexPriceChange }})%</b></p>
            <p class="mb-0" v-if="selectedMasterSymbol === 'BANKEX'">Bankex: <b>{{ bankexPrice }} ({{ bankexPriceChange }})%</b></p>
            <p class="mb-0" v-if="selectedMasterSymbol === 'SENSEX50'">Sensex 50: <b>{{ sensex50Price }} ({{ sensex50PriceChange }})%</b></p>
          </div>

          <!-- Put Strike Selection -->
          <div class="col-3">
            <label for="PutStrike" class="form-label mb-0 d-flex flex-row justify-content-between">
              <span class="ms-4">LTP</span>
              <span>Put Strike</span>
            </label>
            <div class="input-group">
              <span class="input-group-text">{{ latestPutLTP }}</span>
              <select id="PutStrike" class="form-select" aria-label="Put Strike" v-model="selectedPutStrike"
                :class="{ 'disabled-form': isFormDisabled }">
                <option v-for="strike in putStrikes" :key="strike.securityId" :value="strike">
                  {{ strike.strikePrice }}
                </option>
              </select>
            </div>
            <!-- DO NOT REMOVE, USEFUL FOR DEBUGGING -->
            <!-- <div>
              Security ID: {{ defaultPutSecurityId }}
            </div> -->
            <div class="mt-2">
              {{ selectedPutStrike.tradingSymbol }}
            </div>
          </div>
        </div>

        <div class="row">
          <!-- Call Strike Buy/Sell Buttons -->
          <div class="col-3">
            <div class="btn-group w-100">
              <button type="button" class="btn btn-lg btn-success fs-5 my-2 w-75"
                @click="selectedOrderType !== (orderTypes.value && orderTypes.value[1] && orderTypes.value[2]) && placeOrder(getTransactionType('BUY'), 'CALL')"
                v-bind="selectedOrderType === (orderTypes.value && orderTypes.value[1] && orderTypes.value[2]) ? { 'data-bs-toggle': 'modal', 'data-bs-target': '#PlaceLimitOrderWindow' } : {}">
                <span v-if="enableHotKeys">⬆️</span>
                Buy CE
              </button>
              <button type="button" class="btn btn-outline-success fs-5 my-2 dropdown-toggle dropdown-toggle-split w-25"
                data-bs-toggle="dropdown" aria-expanded="false" data-bs-reference="parent" data-bs-offset="0,-7">
                <span class="visually-hidden">Toggle Dropdown</span>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" @click="setOrderDetails('BUY', 'CALL')" data-bs-toggle="modal"
                    data-bs-target="#PlaceLimitOrderWindow">Place Limit Order</a></li>
                <li><a class="dropdown-item" @click="setStopLossLimitOrderDetails('BUY', 'CALL')" data-bs-toggle="modal"
                    data-bs-target="#PlaceStopLossLimitOrderWindow">Place SL LIMIT Order</a></li>                    
              </ul>
            </div>
            <div class="btn-group w-100">
              <button type="button" class="btn btn-lg btn-danger fs-5 w-75"
                @click="selectedOrderType !== (orderTypes.value && orderTypes.value[1] && orderTypes.value[2]) && placeOrder(getTransactionType('SELL'), 'CALL')"
                v-bind="selectedOrderType === (orderTypes.value && orderTypes.value[1] && orderTypes.value[2]) ? { 'data-bs-toggle': 'modal', 'data-bs-target': '#PlaceLimitOrderWindow' } : {}">
                <span v-if="enableHotKeys">⬅️</span>
                Sell CE
              </button>
              <button type="button" class="btn btn-outline-danger fs-5 dropdown-toggle dropdown-toggle-split w-25"
                data-bs-toggle="dropdown" aria-expanded="false" data-bs-reference="parent">
                <span class="visually-hidden">Toggle Dropdown</span>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" @click="setOrderDetails('SELL', 'CALL')" data-bs-toggle="modal"
                    data-bs-target="#PlaceLimitOrderWindow">Place Limit Order</a></li>
                <li><a class="dropdown-item" @click="setStopLossLimitOrderDetails('SELL', 'CALL')" data-bs-toggle="modal"
                    data-bs-target="#PlaceStopLossLimitOrderWindow">Place SL LIMIT Order</a></li>                           
              </ul>
            </div>
          </div>
          
          <!-- Close & Cancel Buttons -->
          <div class="col-6 text-center">
            <button v-if="selectedShoonyaPositionsSet.size === 0 && selectedFlattradePositionsSet.size === 0"
              class="btn btn-lg btn-outline-dark fs-5 w-75 my-2" @click="closeAllPositions">
              <span v-if="enableHotKeys">F6 / </span>
              Close All Positions
            </button>
            <button v-if="selectedShoonyaPositionsSet.size > 0 || selectedFlattradePositionsSet.size > 0"
              class="btn btn-lg btn-outline-dark fs-5 w-75 my-2" @click="closeSelectedPositions">
              <span v-if="enableHotKeys">F6 / </span>
              Close Selected Positions
            </button>
            <button class="btn btn-lg btn-outline-dark fs-5 w-75" @click="cancelPendingOrders">
              <span v-if="enableHotKeys">F7 / </span>
              Cancel Orders
            </button>
          </div>

          <!-- Put Strike Buy/Sell Buttons -->
          <div class="col-3">
            <div class="btn-group w-100">
              <button type="button" class="btn btn-lg btn-success fs-5 my-2 w-75"
                @click="selectedOrderType !== (orderTypes.value && orderTypes.value[1] && orderTypes.value[2]) && placeOrder(getTransactionType('BUY'), 'PUT')"
                v-bind="selectedOrderType === (orderTypes.value && orderTypes.value[1] && orderTypes.value[2]) ? { 'data-bs-toggle': 'modal', 'data-bs-target': '#PlaceLimitOrderWindow' } : {}">
                <span v-if="enableHotKeys">⬇️</span>
                Buy PE
              </button>
              <button type="button" class="btn btn-outline-success fs-5 my-2 dropdown-toggle dropdown-toggle-split w-25"
                data-bs-toggle="dropdown" aria-expanded="false" data-bs-reference="parent" data-bs-offset="0,-7">
                <span class="visually-hidden">Toggle Dropdown</span>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" @click="setOrderDetails('BUY', 'PUT')" data-bs-toggle="modal"
                    data-bs-target="#PlaceLimitOrderWindow">Place Limit Order</a></li>
                <li><a class="dropdown-item" @click="setStopLossLimitOrderDetails('BUY', 'PUT')" data-bs-toggle="modal"
                    data-bs-target="#PlaceStopLossLimitOrderWindow">Place SL LIMIT Order</a></li>                           
              </ul>
            </div>
            <div class="btn-group w-100">
              <button type="button" class="btn btn-lg btn-danger fs-5 w-75"
                @click="selectedOrderType !== (orderTypes.value && orderTypes.value[1] && orderTypes.value[2]) && placeOrder(getTransactionType('SELL'), 'PUT')"
                v-bind="selectedOrderType === (orderTypes.value && orderTypes.value[1] && orderTypes.value[2]) ? { 'data-bs-toggle': 'modal', 'data-bs-target': '#PlaceLimitOrderWindow' } : {}">
                <span v-if="enableHotKeys">➡️</span>
                Sell PE
              </button>
              <button type="button" class="btn btn-outline-danger fs-5 dropdown-toggle dropdown-toggle-split w-25"
                data-bs-toggle="dropdown" aria-expanded="false" data-bs-reference="parent">
                <span class="visually-hidden">Toggle Dropdown</span>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" @click="setOrderDetails('SELL', 'PUT')" data-bs-toggle="modal"
                    data-bs-target="#PlaceLimitOrderWindow">Place Limit Order</a></li>
                <li><a class="dropdown-item" @click="setStopLossLimitOrderDetails('SELL', 'PUT')" data-bs-toggle="modal"
                    data-bs-target="#PlaceStopLossLimitOrderWindow">Place SL LIMIT Order</a></li>                           
              </ul>
            </div>
          </div>
        </div>
      </fieldset>
    </form>
  </section>

  <!-- Positions & Trades -->
  <section class="row py-3">
    <div class="col-12">
      <ul class="nav nav-tabs" id="myTab" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="positions-tab" data-bs-toggle="tab" data-bs-target="#positions-tab-pane"
            type="button" role="tab" aria-controls="positions-tab-pane" aria-selected="true"
            @click="setActiveTab('positions')">
            💸 Positions
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="trades-tab" data-bs-toggle="tab" data-bs-target="#trades-tab-pane" type="button"
            role="tab" aria-controls="trades-tab-pane" aria-selected="false" @click="setActiveTab('trades')">
            📄 Trades
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="automation-tab" data-bs-toggle="tab" data-bs-target="#automation-tab-pane"
            type="button" role="tab" aria-controls="automation-tab-pane" aria-selected="false">
            🤖 Automations
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="refresh-tab" type="button" @click="refreshData">
            🔄 Refresh
          </button>
        </li>	  
      </ul>
      <div class="tab-content" id="myTabContent">
        <div class="tab-pane fade show active" id="positions-tab-pane" role="tabpanel" aria-labelledby="positions-tab"
          tabindex="0">
          <div class="row align-items-center">
            <div class="col-4 text-center py-2">
              <p class="mb-0">
                <b>Net Qty:
                  <span :class="totalNetQty > 0 ? 'text-success' : totalNetQty < 0 ? 'text-danger' : 'text-dark'">
                    {{ totalNetQty }}
                  </span>
                </b>
              </p>
            </div>
            <div class="col-8 text-center py-2">
              <p class="mb-0">
                <span>Total Buy Value: <b>₹ {{ totalBuyValue.toFixed(2) }}</b></span>
                <span class="ms-3">Total Sell Value: <b>₹ {{ totalSellValue.toFixed(2) }}</b></span>
              </p>
              <p class="mb-0">
              </p>
            </div>
          </div>
          <!-- Dhan Positions -->
          <table class="table table-responsive table-hover" v-if="activeFetchFunction === 'fetchDhanPositions'">
            <thead>
              <tr>
                <th scope="col">Symbol Name</th>
                <th scope="col">Position Type</th>
                <th scope="col">Product Type</th>
                <th scope="col">Net Qty</th>
                <th scope="col">Buy Value</th>
                <th scope="col">Sell Value</th>
                <th scope="col">Realized Profit</th>
                <th scope="col">Unrealized Profit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dhanPosition in positionsWithCalculatedProfit" :key="dhanPosition.securityId">
                <td>{{ dhanPosition.tradingSymbol }}</td>
                <td>{{ dhanPosition.positionType }}</td>
                <td>{{ dhanPosition.productType }}</td>
                <td
                  :class="dhanPosition.netQty > 0 ? 'text-success' : dhanPosition.netQty < 0 ? 'text-danger' : 'text-dark'">
                  {{ dhanPosition.netQty }}
                </td>
                <td>{{ dhanPosition.dayBuyValue }}</td>
                <td>{{ dhanPosition.daySellValue }}</td>
                <td
                  :class="dhanPosition.realizedProfit > 0 ? 'text-success' : dhanPosition.realizedProfit < 0 ? 'text-danger' : 'text-dark'">
                  {{ dhanPosition.realizedProfit }}
                </td>
                <td
                  :class="dhanPosition.calculatedUrmtom > 0 ? 'text-success' : dhanPosition.calculatedUrmtom < 0 ? 'text-danger' : 'text-dark'">
                  {{ dhanPosition.calculatedUrmtom.toFixed(2) }}
                </td>
              </tr>
              <tr v-if="dhanPositionBook.length === 0">
                <td colspan="8" class="text-center">No positions on selected broker {{ selectedBroker.brokerName
                  }}</td>
              </tr>
            </tbody>
          </table>
          <!-- Flattrade Positions -->
          <div v-if="activeFetchFunction === 'fetchFlattradePositions'">
            <table class="table table-responsive table-hover">
              <thead>
                <tr>
                  <th scope="col">Symbol Details</th>
                  <th scope="col">Net Avg</th>
                  <th scope="col">LTP</th>
                  <th scope="col" class="text-center">Stoploss</th>
                  <th scope="col" class="text-center">Target</th>
                  <th scope="col">Buy Value</th>
                  <th scope="col">Sell Value</th>
                  <th scope="col">Realized</th>
                  <th scope="col">Unrealized</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="flatTradePositionBook.length">
                  <tr v-for="flattradePosition in sortedPositions" :key="flattradePosition.tsym">
                    <td>
                      <div class="d-flex flex-column align-items-start">
                        <input type="checkbox" :id="'flattradePosition-' + flattradePosition.tsym"
                          v-model="selectedFlattradePositionsSet" :value="flattradePosition.tsym"
                          :disabled="flattradePosition.netqty <= 0" />

                        <div class="d-flex ">
                          {{ flattradePosition.tsym }}
                        </div>

                        <div class="d-flex flex-row">
                          <span
                            :class="flattradePosition.netqty > 0 ? 'text-success' : flattradePosition.netqty < 0 ? 'text-danger' : 'text-dark'">
                            Qty: {{ flattradePosition.netqty }}
                          </span>
                          <span class="ms-2">
                            Side:
                            <b>{{ flattradePosition.netqty > 0 ? 'B' : flattradePosition.netqty < 0 ? 'S' : '-' }}</b>
                          </span>
                          <span class="ms-2">
                            Type: {{ flattradePosition.prd }}
                          </span>
                        </div>

                      </div>
                    </td>
                    <td>{{ flattradePosition.netavgprc }}</td>
                    <td>{{ positionLTPs[flattradePosition.tsym] || '-' }}</td>
                    <td>
                      <template v-if="Number(flattradePosition.netqty) !== 0 && tradeSettings.enableStoploss === true">
                        <div class="d-flex align-items-center">
                          <div class="ms-2 d-flex flex-row">
                            <button class="btn btn-sm btn-outline-danger"
                              @click="adjustStoplossPrice(flattradePosition.tsym, tradeSettings.stoplossStep)">➖</button>
                            <button class="btn btn-sm btn-outline-success ms-2"
                              @click="adjustStoplossPrice(flattradePosition.tsym, -tradeSettings.stoplossStep)">➕</button>
                          </div>
                        </div>
                        <div class="text-center mt-2">
                          <span class="text-danger">
                            <b>{{ formatPrice(positionStoplossesPrice[getSymbol(flattradePosition)]) }}</b>
                          </span>
                          <br />
                          <span class="text-secondary">
                            ( {{ formatPrice(positionStoplosses[getSymbol(flattradePosition)]) }} pts)
                          </span>
                        </div>
                      </template>
                      <template v-else>
                        -
                      </template>
                    </td>
                    <td>
                      <template v-if="Number(flattradePosition.netqty) !== 0 && tradeSettings.enableTarget === true">
                        <div class="d-flex align-items-center">
                          <div class="ms-2 d-flex flex-row">
                            <button class="btn btn-sm btn-outline-danger"
                              @click="adjustTargetPrice(flattradePosition.tsym, -tradeSettings.targetStep)">➖</button>
                            <button class="btn btn-sm btn-outline-success ms-2"
                              @click="adjustTargetPrice(flattradePosition.tsym, tradeSettings.targetStep)">➕</button>
                          </div>
                        </div>
                        <div class="text-center mt-2">
                          <span class="text-success">
                            <b>{{ formatPrice(positionTargetsPrice[getSymbol(flattradePosition)]) }}</b>
                          </span>
                          <br />
                          <span class="text-secondary">
                            ( {{ formatPrice(positionTargets[getSymbol(flattradePosition)]) }} pts)
                          </span>
                        </div>
                      </template>
                      <template v-else>
                        -
                      </template>
                    </td>
                    <td>{{ flattradePosition.daybuyamt }}</td>
                    <td>{{ flattradePosition.daysellamt }}</td>
                    <td
                      :class="flattradePosition.rpnl > 0 ? 'text-success' : flattradePosition.rpnl < 0 ? 'text-danger' : 'text-dark'">
                      {{ flattradePosition.rpnl }}
                    </td>
                    <td
                      :class="flattradePosition.calculatedUrmtom > 0 ? 'text-success' : flattradePosition.calculatedUrmtom < 0 ? 'text-danger' : 'text-dark'">
                      {{ flattradePosition.calculatedUrmtom.toFixed(2) }}
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="10" class="text-center">No positions on selected broker {{ selectedBroker.brokerName }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Shoonya Positions -->
          <div v-if="activeFetchFunction === 'fetchShoonyaPositions'">
            <table class="table table-responsive table-hover">
              <thead>
                <tr>
                  <th scope="col">Symbol Details</th>
                  <th scope="col">Net Avg</th>
                  <th scope="col">LTP</th>
                  <th scope="col" class="text-center">Stoploss</th>
                  <th scope="col" class="text-center">Target</th>
                  <th scope="col">Buy Value</th>
                  <th scope="col">Sell Value</th>
                  <th scope="col">Realized</th>
                  <th scope="col">Unrealized</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="shoonyaPositionBook.length">
                  <tr v-for="shoonyaPosition in sortedPositions" :key="shoonyaPosition.tsym">
                    <td>
                      <div class="d-flex flex-column align-items-start">
                        <input type="checkbox" :id="'shoonyaPosition-' + shoonyaPosition.tsym"
                          v-model="selectedShoonyaPositionsSet" :value="shoonyaPosition.tsym"
                          :disabled="shoonyaPosition.netqty <= 0" />
                        <div class="d-flex ">
                          {{ shoonyaPosition.tsym }}
                        </div>
                        <div class="d-flex flex-row">
                          <span
                            :class="shoonyaPosition.netqty > 0 ? 'text-success' : shoonyaPosition.netqty < 0 ? 'text-danger' : 'text-dark'">
                            Qty: {{ shoonyaPosition.netqty }}
                          </span>
                          <span class="ms-2">
                            Side:
                            <b>{{ shoonyaPosition.netqty > 0 ? 'B' : shoonyaPosition.netqty < 0 ? 'S' : '-' }}</b>
                          </span>
                          <span class="ms-2">
                            Type: {{ shoonyaPosition.prd }}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{{ shoonyaPosition.netavgprc }}</td>
                    <td>{{ positionLTPs[shoonyaPosition.tsym] || '-' }}</td>
                    <td>
                      <template v-if="Number(shoonyaPosition.netqty) !== 0">
                        <div class="d-flex align-items-center">
                          <div class="ms-2 d-flex flex-row">
                            <button class="btn btn-sm btn-outline-danger"
                              @click="adjustStoplossPrice(shoonyaPosition.tsym, tradeSettings.stoplossStep)">➖</button>
                            <button class="btn btn-sm btn-outline-success ms-2"
                              @click="adjustStoplossPrice(shoonyaPosition.tsym, -tradeSettings.stoplossStep)">➕</button>
                          </div>
                        </div>
                        <div class="text-center mt-2">
                          <span class="text-danger">
                            <b>{{ formatPrice(positionStoplossesPrice[getSymbol(shoonyaPosition)]) }}</b>
                          </span>
                          <br />
                          <span class="text-secondary">
                            ( {{ formatPrice(positionStoplosses[getSymbol(shoonyaPosition)]) }} pts)
                          </span>
                        </div>
                      </template>
                      <template v-else>
                        -
                      </template>
                    </td>
                    <td>
                      <template v-if="Number(shoonyaPosition.netqty) !== 0">
                        <div class="d-flex align-items-center">
                          <div class="ms-2 d-flex flex-row">
                            <button class="btn btn-sm btn-outline-danger"
                              @click="adjustTargetPrice(shoonyaPosition.tsym, -tradeSettings.targetStep)">➖</button>
                            <button class="btn btn-sm btn-outline-success ms-2"
                              @click="adjustTargetPrice(shoonyaPosition.tsym, tradeSettings.targetStep)">➕</button>
                          </div>
                        </div>
                        <div class="text-center mt-2">
                          <span class="text-success">
                            <b> {{ formatPrice(positionTargetsPrice[getSymbol(shoonyaPosition)]) }}</b>
                          </span>
                          <br />
                          <span class="text-secondary">
                            ( {{ formatPrice(positionTargets[getSymbol(shoonyaPosition)]) }} pts)
                          </span>
                        </div>
                      </template>
                      <template v-else>
                        -
                      </template>
                    </td>
                    <td>{{ shoonyaPosition.daybuyamt }}</td>
                    <td>{{ shoonyaPosition.daysellamt }}</td>
                    <td
                      :class="shoonyaPosition.rpnl > 0 ? 'text-success' : shoonyaPosition.rpnl < 0 ? 'text-danger' : 'text-dark'">
                      {{ shoonyaPosition.rpnl }}
                    </td>
                    <td
                      :class="shoonyaPosition.calculatedUrmtom > 0 ? 'text-success' : shoonyaPosition.calculatedUrmtom < 0 ? 'text-danger' : 'text-dark'">
                      {{ shoonyaPosition.calculatedUrmtom.toFixed(2) }}
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="10" class="text-center">No positions on selected broker {{ selectedBroker.brokerName }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="text-secondary">
            Stoploss and Target set in this app won't reflect on your broker's own Stoploss and Target. However, they
            will close
            positions when triggered, as long as this app is open and connected to the internet.
          </p>
        </div>
        <div class="tab-pane fade" id="trades-tab-pane" role="tabpanel" aria-labelledby="trades-tab" tabindex="0">
        <!-- Dhan Trades -->
        <div v-if="activeFetchFunction === 'fetchDhanOrdersTradesBook'">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Side</th>
                <th>Order ID<br>Symbol</th>
                <th>Order Type</th>
                <th>Quantity</th>
                <th>Price & <br> Trigger Price</th>
                <th>Time</th>
                <th>Status & Reason</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dhanOrder in dhanOrders" :key="dhanOrder.orderId">
                <td title="Order">🛒 {{ dhanOrder.transactionType }}</td>
                <td>{{ dhanOrder.orderId }} <br> {{ dhanOrder.tradingSymbol }}</td>
                <td>
                  <template v-if="!modifyingOrders[dhanOrder.orderId]">
                    {{ dhanOrder.orderType }}
                  </template>
                  <select v-else v-model="modifiedOrderData[dhanOrder.orderId].modifiedOrderType" @change="handleOrderTypeChange(dhanOrder)" class="form-select form-select-sm" autocomplete="off">
                    <option value="MARKET">Market</option>
                    <option value="LIMIT">Limit</option>
                    <option value="STOP_LOSS">Stop Loss</option>
                  </select>
                </td>
                <td>
                  <template v-if="!modifyingOrders[dhanOrder.orderId]">
                    {{ dhanOrder.quantity }}
                  </template>
                  <input v-else v-model.number="modifiedOrderData[dhanOrder.orderId].modifiedQuantity" type="number" @input="validateInput(dhanOrder, 'modifiedQuantity')" class="form-control form-control-sm" autocomplete="off"/>
                </td>
                <td>
                  <template v-if="!modifyingOrders[dhanOrder.orderId]">
                    {{ dhanOrder.price }}
                  </template>
                  <template v-else>
                    <input v-model.number="modifiedOrderData[dhanOrder.orderId].modifiedPrice" type="number" step="0.05" @input="validateInput(dhanOrder, 'modifiedPrice')" :disabled="modifiedOrderData[dhanOrder.orderId].modifiedOrderType === 'MARKET'" class="form-control form-control-sm" autocomplete="off"/>
                  </template>
                  <br>
                  <template v-if="!modifyingOrders[dhanOrder.orderId]">
                    {{ dhanOrder.triggerPrice === 0 ? '' : dhanOrder.triggerPrice }}
                  </template>
                  <template v-else-if="modifyingOrders[dhanOrder.orderId] && modifiedOrderData[dhanOrder.orderId].modifiedOrderType === 'STOP_LOSS'">
                    <input v-model.number="modifiedOrderData[dhanOrder.orderId].modifiedTriggerPrice" type="number" step="0.05" @input="validateInput(dhanOrder, 'modifiedTriggerPrice')" placeholder="Trigger Price" class="form-control form-control-sm mt-1" autocomplete="off"/>
                  </template>
                </td>
                <td>{{ formatTime(dhanOrder.createTime) }}</td>
                <td :class="{
                  'text-danger': dhanOrder.orderStatus === 'REJECTED',
                  'text-warning': dhanOrder.orderStatus === 'PENDING' || dhanOrder.orderStatus === 'OPEN'
                }">
                  {{ dhanOrder.orderStatus }}
                  {{ dhanOrder.omsErrorDescription || '' }}
                </td>
                <td v-if="dhanOrder.orderStatus === 'OPEN' || dhanOrder.orderStatus === 'PENDING'" class="text-center">
                  <template v-if="!modifyingOrders[dhanOrder.orderId]">
                    <button @click="setModifyOrder(dhanOrder.orderId)" title="Edit" class="btn btn-sm btn-outline-primary">
                      ✏️
                    </button>
                    <button @click="cancelOpenOrder(dhanOrder.orderId)" title="Cancel Order" class="btn btn-sm btn-outline-danger">
                      🗑️
                    </button>
                  </template>
                  <template v-else>
                    <div class="btn-group btn-group-sm">
                      <button @click="modifyOpenOrder(dhanOrder.orderId)" :disabled="!isOrderModified(dhanOrder.orderId) || !isInputValid(dhanOrder.orderId)" title="Confirm Modification" class="btn btn-sm btn-success">
                        ✓
                      </button>
                      <button @click="cancelModifyOrder(dhanOrder.orderId)" title="Cancel Modification" class="btn btn-sm btn-secondary">
                        ✗
                      </button>
                      <button @click="cancelOpenOrder(dhanOrder.orderId)" title="Cancel Order" class="btn btn-sm btn-outline-danger">
                        🗑️
                      </button>
                    </div>
                  </template>
                </td>
                <td v-else></td>
              </tr>
              <tr v-if="dhanOrders.length === 0">
                <td colspan="8" class="text-center">No orders or trades on Dhan</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Flattrade and Shoonya Trades -->
        <div v-if="activeFetchFunction === 'fetchFlattradeOrdersTradesBook' || activeFetchFunction === 'fetchShoonyaOrdersTradesBook'">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Side</th>
                <th>Order ID & <br> Symbol</th>
                <th>Order Type</th>
                <th>Quantity</th>
                <th>Price & <br> Trigger Price</th>
                <th>Time</th>
                <th>Status & Reason</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="item in combinedOrdersAndTrades" :key="item.order.norenordno">
                <tr v-if="item.order.status !== 'COMPLETE'">
                  <td title="Order">🛒 {{ item.order.trantype }}</td>
                  <td>{{ item.order.norenordno }} <br> {{ item.order.tsym }}</td>
                  <td>
                    <template v-if="!modifyingOrders[item.order.norenordno]">
                      {{ item.order.prctyp }}
                    </template>
                    <template v-else>
                    <select v-model="modifiedOrderData[item.order.norenordno].modifiedOrderType" @change="handleOrderTypeChange(item)" class="form-select form-select-sm" autocomplete="off">
                      <option value="MKT">Market</option>
                      <option value="LMT">Limit</option>
                      <option value="SL-LMT">Stop Loss</option>
                    </select>
                    </template>
                  </td>
                  <td>
                    <template v-if="!modifyingOrders[item.order.norenordno]">
                      {{ item.order.qty }}
                    </template>
                    <template v-else>
                    <input v-model.number="modifiedOrderData[item.order.norenordno].modifiedQuantity" type="number" @input="validateInput(item, 'modifiedQuantity')" class="form-control form-control-sm" autocomplete="off" />
                    </template>
                  </td>
                  <td>
                    <template v-if="!modifyingOrders[item.order.norenordno]">
                      {{ item.order.prc }}
                    </template>
                    <template v-else>
                    <input v-model.number="modifiedOrderData[item.order.norenordno].modifiedPrice" type="number" step="0.05" @input="validateInput(item, 'modifiedPrice')" :disabled="modifiedOrderData[item.order.norenordno].modifiedOrderType === 'MKT'" class="form-control form-control-sm" autocomplete="off" />
                    </template>
                    <br>
                    <template v-if="!modifyingOrders[item.order.norenordno]">
                      {{ item.order.trgprc || '' }}
                    </template>
                    <template v-else>
                    <input v-model.number="modifiedOrderData[item.order.norenordno].modifiedTriggerPrice" type="number" step="0.05" @input="handleTriggerPriceChange(item)" :disabled="modifiedOrderData[item.order.norenordno].modifiedOrderType !== 'SL-LMT'" class="form-control form-control-sm" autocomplete="off" />
                    </template>
                  </td>
                  <td>{{ formatTime(item.order.norentm) }}</td>
                  <td :class="{
                    'text-danger': item.order.status === 'REJECTED',
                    'text-warning': item.order.status === 'PENDING' || item.order.status === 'OPEN' || item.order.status === 'TRIGGER_PENDING'
                  }">
                    {{ item.order.status }}
                    {{ item.order.rejreason || '' }}
                  </td>
                  <td v-if="item.order.status === 'OPEN' || item.order.status === 'PENDING' || item.order.status === 'TRIGGER_PENDING'" class="text-center">
                    <template v-if="!modifyingOrders[item.order.norenordno]">
                      <button @click="setModifyOrder(item.order.norenordno)" title="Edit" class="btn btn-sm btn-outline-primary">
                        ✏️
                      </button>
                      <button @click="cancelOpenOrder(item.order.norenordno)" title="Cancel Order" class="btn btn-sm btn-outline-danger">
                        🗑️
                      </button>
                    </template>
                    <template v-else>
                      <div class="btn-group btn-group-sm">
                        <button @click="modifyOpenOrder(item.order.norenordno)" :disabled="!isOrderModified(item.order.norenordno) || !isInputValid(item.order.norenordno)" title="Confirm Modification" class="btn btn-sm btn-success">
                          ✓
                        </button>
                        <button @click="cancelModifyOrder(item.order.norenordno)" title="Cancel Modification" class="btn btn-sm btn-secondary">
                          ✗
                        </button>
                        <button @click="cancelOpenOrder(item.order.norenordno)" title="Cancel Order" class="btn btn-sm btn-outline-danger">
                          🗑️
                        </button>
                      </div>
                    </template>
                  </td>
                  <td v-else></td>
                </tr>
                <tr v-if="item.trade" class="nested-trade-row">
                  <td title="Trade">✔️ {{ item.trade.trantype }}</td>
                  <td>{{ item.trade.norenordno }} <br> {{ item.trade.tsym }}</td>
                  <td>{{ item.trade.prctyp }}</td>
                  <td>{{ item.trade.qty }}</td>
                  <td>{{ item.trade.flprc }}</td>
                  <td>{{ formatTime(item.trade.norentm) }}</td>
                  <td class="text-success">{{ item.trade.stat === 'Ok' ? 'EXECUTED' : item.trade.stat }}</td>
                  <td></td>
                </tr>
              </template>
              <tr v-if="combinedOrdersAndTrades.length === 0">
                <td colspan="8" class="text-center">No orders or trades on selected broker {{ selectedBroker.brokerName }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Trades Tab Descriptions -->
          <p class="text-secondary" v-if="selectedBroker?.brokerName !== 'Dhan'">
            This trades tab fetches orders and trades from selected broker and combines them.
          </p>
          <p class="text-secondary" v-if="selectedBroker?.brokerName === 'Dhan'">
            This trades tab fetches orders from selected broker.
          </p>
        </div>
        <div class="tab-pane fade" id="automation-tab-pane" role="tabpanel" aria-labelledby="automation-tab"
          tabindex="0">

          <div class="card text-center py-3">
            <div class="card-body text-start">
              <span class="fs-5 text-danger">Coming Soon</span>
              <h5>Smart Automations for Risk Management.</h5>
              <ul class="text-secondary">
                <li>if deployment value higher than 25% of total capital, positions will be force closed.</li>
                <li>if loss higher than 3% of total capital, activates kill switch to halt trading.</li>
                <li>kill switch activates if total buy/sell value crosses above 5 times of allowed deployment value
                </li>
              </ul>
              <span class="p-1 rounded bg-warning text-dark">This is a rough draft and will be updated in the next
                release.
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- Toast Alert -->
  <ToastAlert :show="showToast" :message="toastMessage" @update:show="updateToastVisibility" />

  <!-- Limit Price Input Modal (conditionally rendered) -->
  <div class="modal fade" id="PlaceLimitOrderWindow" tabindex="-1" aria-labelledby="PlaceLimitOrderWindowLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="PlaceLimitOrderWindowLabel">
            {{ modalTransactionType }} {{ modalOptionType }}: {{ selectedMasterSymbol }} {{ selectedStrike.strikePrice
            }}
            {{
              selectedStrike.expiryDate }}
          </h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"
            @click="resetOrderType"></button>
        </div>
        <div class="modal-body">
          <div class="col-2">
            <label for="LimitPrice" class="form-label mb-0">Limit Price</label>
            <input type="number" id="LimitPrice" class="form-control" v-model="limitPrice"
              placeholder="Enter limit price">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
            @click="resetOrderTypeIfNeeded">Cancel</button>
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal"
            @click="placeOrder(modalTransactionType, modalOptionType)">Place
            Order</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Stop Loss Limit Order Input Modal-->
  <div class="modal fade" id="PlaceStopLossLimitOrderWindow" tabindex="-1" aria-labelledby="PlaceStopLossLimitOrderWindowLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="PlaceStopLossLimitOrderWindowLabel">
            {{ modalTransactionType }} {{ modalOptionType }}: {{ selectedMasterSymbol }} {{ selectedStrike.strikePrice
            }}
            {{
              selectedStrike.expiryDate }}
          </h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"
            @click="resetOrderType"></button>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col-6">
              <label for="TriggerPrice" class="form-label mb-0">Trigger Price</label>
              <input type="number" id="TriggerPrice" class="form-control" v-model="triggerPrice"
                placeholder="Enter trigger price">
            </div>
            <div class="col-6">
              <label for="stopLossLimitPrice" class="form-label mb-0">Limit Price</label>
              <input type="number" id="stopLossLimitPrice" class="form-control" v-model="stopLossLimitPrice"
                placeholder="Enter limit price">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
            @click="resetOrderTypeIfNeeded">Cancel</button>
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal"
            @click="placeOrder(modalTransactionType, modalOptionType)">Place
            Order</button>
        </div>
      </div>
    </div>
  </div>  

  <!-- Kill Swtich Activation Confirmation Modal -->
  <div class="modal fade" id="KillSwitchActivationConfirmationModal" tabindex="-1"
    aria-labelledby="KillSwitchActivationConfirmationModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="KillSwitchActivationConfirmationModalLabel">Confirm Kill Switch Activation</h5>
        </div>
        <div class="modal-body">
          <blockquote class="blockquote">
            This action will <b class="text-danger">close all positions</b> and block trading for the next 6 hours.
          </blockquote>
          <p>Are you sure you want to continue?</p>
        </div>
        <div class="modal-footer">
          <div class="d-flex flex-row justify-content-between w-100">
            <button type="button" class="btn btn-outline-secondary w-50 me-1" data-bs-dismiss="modal">No</button>
            <button type="button" class="btn btn-danger w-50 ms-1" data-bs-dismiss="modal" @click="toggleKillSwitch">
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, reactive } from 'vue';
import { checkAllTokens, getBrokerStatus, tokenStatus } from '@/utils/brokerTokenValidator';
import axios from 'axios';
import ToastAlert from '../components/ToastAlert.vue';
import qs from 'qs';
import { debounce } from 'lodash';
// import LineChart from '../components/LineChart.vue';
// const showLineChart = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const updateToastVisibility = (value) => {
  showToast.value = value;
};
const showToastMessage = (message) => {
  toastMessage.value = message;
  showToast.value = true;
};

const brokerStatus = computed(() => {
  const dhanDetails = JSON.parse(localStorage.getItem('broker_Dhan') || '{}');
  const flattradeDetails = JSON.parse(localStorage.getItem('broker_Flattrade') || '{}');
  const shoonyaDetails = JSON.parse(localStorage.getItem('broker_Shoonya') || '{}');

  const dhanClientId = dhanDetails.clientId;
  const dhanApiToken = dhanDetails.apiToken;
  const flattradeClientId = flattradeDetails.clientId;
  const flattradeApiToken = localStorage.getItem('FLATTRADE_API_TOKEN');
  const shoonyaApiToken = localStorage.getItem('SHOONYA_API_TOKEN');
  const shoonyaClientId = shoonyaDetails.clientId;

  if (selectedBroker.value?.brokerName === 'Dhan') {
    if (dhanClientId && dhanApiToken) {
      return tokenStatus.Dhan === 'valid' ? 'Connected' : 'Token Expired';
    }
    return 'Not Connected';
  }
  else if (selectedBroker.value?.brokerName === 'Flattrade') {
    if (flattradeClientId && flattradeApiToken) {
      return tokenStatus.Flattrade === 'valid' ? 'Connected' : 'Token Expired';
    }
    return 'Not Connected';
  }
  else if (selectedBroker.value?.brokerName === 'Shoonya') {
    if (shoonyaClientId && shoonyaApiToken) {
      return tokenStatus.Shoonya === 'valid' ? 'Connected' : 'Token Expired';
    }
    return 'Not Connected';
  }
  return 'Not Connected';
});

const activeTab = ref('positions');
const setActiveTab = (tab) => {
  activeTab.value = tab;
};

// Kill Switch - Client Side
const killSwitchActive = ref(localStorage.getItem('KillSwitchStatus') === 'true');
const activationTime = ref(parseInt(localStorage.getItem('KillSwitchActivationTime') || '0'));
const currentTime = ref(Date.now());

// Initialize kill switch state
const initKillSwitch = () => {
  const storedStatus = localStorage.getItem('KillSwitchStatus');
  const storedActivationTime = localStorage.getItem('KillSwitchActivationTime');

  if (storedStatus === 'true' && storedActivationTime) {
    killSwitchActive.value = true;
    activationTime.value = parseInt(storedActivationTime);
  } else {
    // Deactivate kill switch if KillSwitchActivationTime is missing
    killSwitchActive.value = false;
    activationTime.value = 0;
    localStorage.removeItem('KillSwitchStatus');
    localStorage.removeItem('KillSwitchActivationTime');
  }
};

const isFormDisabled = computed(() => killSwitchActive.value);
const enableHotKeys = ref(localStorage.getItem('EnableHotKeys') !== 'false'); // Default to true if not set

const handleKillSwitchClick = () => {
  if (killSwitchActive.value) {
    // If the kill switch is already active, deactivate it directly
    toggleKillSwitch();
  }
  // If it's not active, the modal will be shown due to data-bs-target and data-bs-toggle
};
// Modify the toggleKillSwitch function
const toggleKillSwitch = async () => {
  const newStatus = killSwitchActive.value ? 'DEACTIVATED' : 'ACTIVATED';
  if (newStatus === 'ACTIVATED') {
    await closeAllPositions(); // Wait for closeAllPositions to complete
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (newStatus === 'DEACTIVATED' && remainingTimeInMs.value > 0) {
    cycleClockEmoji();
    showToastMessage('Kill Switch cannot be deactivated within 6 hours of activation');
    return;
  }

  // Handle different response messages
  if (newStatus === 'ACTIVATED') {
    showToastMessage('Kill Switch activated successfully');
    killSwitchActive.value = true;
    localStorage.setItem('KillSwitchStatus', 'true');
    activationTime.value = Date.now();
    localStorage.setItem('KillSwitchActivationTime', activationTime.value.toString());
    enableHotKeys.value = false;
  } else {
    showToastMessage('Kill Switch deactivated successfully');
    killSwitchActive.value = false;
    localStorage.removeItem('KillSwitchStatus');
    activationTime.value = 0;
    localStorage.removeItem('KillSwitchActivationTime');
  }
};
const remainingTimeInMs = computed(() => {
  if (!activationTime.value || !killSwitchActive.value) return 0;
  const sixHoursInMillis = 6 * 60 * 60 * 1000;
  return Math.max(0, sixHoursInMillis - (currentTime.value - activationTime.value));
});
const killSwitchRemainingTime = computed(() => {
  if (remainingTimeInMs.value === 0) return '';

  const hours = Math.floor(remainingTimeInMs.value / (60 * 60 * 1000));
  const minutes = Math.floor((remainingTimeInMs.value % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remainingTimeInMs.value % (60 * 1000)) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
});
// Watch for changes in killSwitchRemainingTime
watch(killSwitchRemainingTime, (newValue) => {
  if (newValue === '' && killSwitchActive.value) {
    toggleKillSwitch();
  }
});
// Watch for changes in remainingTimeInMs
watch(remainingTimeInMs, (newValue) => {
  if (newValue === 0 && killSwitchActive.value) {
    toggleKillSwitch();
  }
});
const killSwitchButtonText = computed(() => killSwitchActive.value ? 'Deactivate' : 'Activate');
const killSwitchButtonClass = computed(() => killSwitchActive.value ? 'btn btn-sm btn-danger shadow fs-5' : 'btn btn-sm btn-success shadow fs-5');

// Fetch brokers and set selectedBroker
const selectedBroker = ref(null);
const selectedBrokerName = ref('');
const availableBrokers = computed(() => {
  return Object.keys(localStorage)
    .filter(key => key.startsWith('broker_'))
    .map(key => key.replace('broker_', ''));
});
// Function to set selected broker and save to localStorage
const updateSelectedBroker = () => {
  const availableBrokerNames = availableBrokers.value;

  if (availableBrokerNames.length === 0) {
    // No brokers available, remove selectedBroker from localStorage
    selectedBroker.value = null;
    localStorage.removeItem('selectedBroker');
    selectedBrokerName.value = '';
  } else if (selectedBrokerName.value && availableBrokerNames.includes(selectedBrokerName.value)) {
    const brokerDetails = JSON.parse(localStorage.getItem(`broker_${selectedBrokerName.value}`) || '{}');
    selectedBroker.value = brokerDetails;
    localStorage.setItem('selectedBroker', JSON.stringify(brokerDetails));
  } else {
    // If the selected broker is not available, clear the selection
    selectedBroker.value = null;
    localStorage.removeItem('selectedBroker');
    selectedBrokerName.value = '';
  }
};


// Fetch trading symbols and strikes
const selectedExchange = ref({});
const selectedMasterSymbol = ref('');
const selectedQuantity = ref(0);
const selectedExpiry = ref(null);
const selectedCallStrike = ref({});
const selectedPutStrike = ref({});
const exchangeSymbols = ref({});

const updateExchangeSymbols = () => {
  const symbolData = {
    NIFTY: {
      dhan: { exchangeCode: '0', exchangeSecurityId: '13' },
      other: { exchangeCode: 'NSE', exchangeSecurityId: '26000' }
    },
    BANKNIFTY: {
      dhan: { exchangeCode: '0', exchangeSecurityId: '25' },
      other: { exchangeCode: 'NSE', exchangeSecurityId: '26009' }
    },
    FINNIFTY: {
      dhan: { exchangeCode: '0', exchangeSecurityId: '27' },
      other: { exchangeCode: 'NSE', exchangeSecurityId: '26037' }
    },
    MIDCPNIFTY: {
      dhan: { exchangeCode: '0', exchangeSecurityId: '442' },
      other: { exchangeCode: 'NSE', exchangeSecurityId: '26074' }
    },
    NIFTYNXT50: {
      dhan: { exchangeCode: '0', exchangeSecurityId: '38' },
      other: { exchangeCode: 'NSE', exchangeSecurityId: '26013' }
    },
    SENSEX: {
      dhan: { exchangeCode: '1', exchangeSecurityId: '51' },
      other: { exchangeCode: 'BSE', exchangeSecurityId: '1' }
    },
    BANKEX: {
      dhan: { exchangeCode: '1', exchangeSecurityId: '69' },
      other: { exchangeCode: 'BSE', exchangeSecurityId: '12' }
    },
    SENSEX50: {
      dhan: { exchangeCode: '1', exchangeSecurityId: '83' },
      other: { exchangeCode: 'BSE', exchangeSecurityId: '47' }
    },
  };

  if (selectedBroker.value?.brokerName === 'Dhan') {
    exchangeSymbols.value = {
      NSE: ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'NIFTYNXT50'],
      BSE: ['SENSEX', 'BANKEX', 'SENSEX50'],
    };
  } else if (selectedBroker.value?.brokerName === 'Flattrade' || selectedBroker.value?.brokerName === 'Shoonya') {
    exchangeSymbols.value = {
      NFO: ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'NIFTYNXT50'],
      BFO: ['SENSEX', 'BANKEX', 'SENSEX50'],
    };
  }

  // Store symbolData separately
  exchangeSymbols.value.symbolData = symbolData;
};
// Add this computed property
const exchangeOptions = computed(() => {
  return Object.keys(exchangeSymbols.value).filter(key => key !== 'symbolData');
});
const setDefaultExchangeAndMasterSymbol = () => {
  const exchanges = exchangeOptions.value;
  if (exchanges.length > 0) {
    // Set the exchange
    const savedExchange = localStorage.getItem('selectedExchange');
    selectedExchange.value = savedExchange && exchanges.includes(savedExchange)
      ? savedExchange
      : exchanges[0];

    // Set the master symbol
    if (exchangeSymbols.value[selectedExchange.value].length > 0) {
      const savedMasterSymbol = localStorage.getItem('selectedMasterSymbol');
      selectedMasterSymbol.value = savedMasterSymbol && exchangeSymbols.value[selectedExchange.value].includes(savedMasterSymbol)
        ? savedMasterSymbol
        : exchangeSymbols.value[selectedExchange.value][0];
    }
  }
};
// New function to save user's choice
const saveUserChoice = () => {
  localStorage.setItem('selectedExchange', selectedExchange.value);
  localStorage.setItem('selectedMasterSymbol', selectedMasterSymbol.value);
};
const callStrikes = ref([]);
const putStrikes = ref([]);
const expiryDates = ref([]);
const synchronizeOnLoad = ref(true);
const niftyPrice = ref('N/A');
const bankNiftyPrice = ref('N/A');
const finniftyPrice = ref('N/A');
const niftynxt50Price = ref('N/A');
const midcpniftyPrice = ref('N/A');
const sensexPrice = ref('N/A');
const bankexPrice = ref('N/A');
const sensex50Price = ref('N/A');
const niftyPriceChange = ref('N/A');
const bankNiftyPriceChange = ref('N/A');
const finniftyPriceChange = ref('N/A');
const niftynxt50PriceChange = ref('N/A');
const midcpniftyPriceChange = ref('N/A');
const sensexPriceChange = ref('N/A');
const bankexPriceChange = ref('N/A');
const sensex50PriceChange = ref('N/A');
// Add a new function to get the initial price
const getInitialPrice = (symbol) => {
  const strike = callStrikes.value.find(s =>
    s.tradingSymbol.includes(symbol) &&
    (selectedBroker.value?.brokerName === 'Dhan' ?
      s.tradingSymbol.endsWith('-CE') :
      /C\d+$/.test(s.tradingSymbol))
  );
  return strike ? parseFloat(strike.strikePrice) : null;
};
const dataFetched = ref(false);
const fetchTradingData = async () => {
  let response;
  if (selectedBroker.value?.brokerName === 'Dhan') {
    response = await fetch(`http://localhost:3000/dhanSymbols?exchangeSymbol=${selectedExchange.value}&masterSymbol=${selectedMasterSymbol.value}`);
  } else if (selectedBroker.value?.brokerName === 'Flattrade') {
    response = await fetch(`http://localhost:3000/flattradeSymbols?exchangeSymbol=${selectedExchange.value}&masterSymbol=${selectedMasterSymbol.value}`);
    // response = await fetch(`http://localhost:3000/shoonyaSymbols?exchangeSymbol=${selectedExchange.value}&masterSymbol=${selectedMasterSymbol.value}`);
    // console.log('Flattrade Symbols:', response);
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    response = await fetch(`http://localhost:3000/shoonyaSymbols?exchangeSymbol=${selectedExchange.value}&masterSymbol=${selectedMasterSymbol.value}`);
    // console.log('Shoonya Symbols:', response);
  } else {
    throw new Error('Unsupported broker');
  }

  const data = await response.json();
  // console.log('Data:', data);
  expiryDates.value = data.expiryDates;

  // Filter by selected expiry date before sorting and mapping
  callStrikes.value = data.callStrikes
    .filter(strike => strike.expiryDate === selectedExpiry.value)
    .sort((a, b) => parseInt(a.strikePrice) - parseInt(b.strikePrice))
    .map(strike => ({ ...strike, strikePrice: parseInt(strike.strikePrice) }));

  putStrikes.value = data.putStrikes
    .filter(strike => strike.expiryDate === selectedExpiry.value)
    .sort((a, b) => parseInt(a.strikePrice) - parseInt(b.strikePrice))
    .map(strike => ({ ...strike, strikePrice: parseInt(strike.strikePrice) }));

  // After fetching and setting callStrikes and putStrikes
  if (niftyPrice.value === 'N/A') niftyPrice.value = getInitialPrice('NIFTY');
  if (bankNiftyPrice.value === 'N/A') bankNiftyPrice.value = getInitialPrice('BANKNIFTY');
  if (finniftyPrice.value === 'N/A') finniftyPrice.value = getInitialPrice('FINNIFTY');
  if (niftynxt50Price.value === 'N/A') niftynxt50Price.value = getInitialPrice('NIFTYNXT50');
  if (midcpniftyPrice.value === 'N/A') midcpniftyPrice.value = getInitialPrice('MIDCPNIFTY');
  if (sensexPrice.value === 'N/A') sensexPrice.value = getInitialPrice('SENSEX');
  if (bankexPrice.value === 'N/A') bankexPrice.value = getInitialPrice('BANKEX');
  if (sensex50Price.value === 'N/A') sensex50Price.value = getInitialPrice('SENSEX50');

  updateStrikesForExpiry(selectedExpiry.value);
  dataFetched.value = true;
};
// Add watchers for the price values
watch([niftyPrice, bankNiftyPrice, finniftyPrice, niftynxt50Price, midcpniftyPrice, sensexPrice, bankexPrice, sensex50Price], () => {
  if (selectedExpiry.value) {
    updateStrikesForExpiry(selectedExpiry.value);
  }
});
const formatDate = (dateString) => {
  if (!dataFetched.value || !dateString) {
    return ''; // Return empty string if data hasn't been fetched or dateString is null
  }

  if (selectedBroker.value?.brokerName === 'Dhan') {
    return dateString.split(' ')[0];
  } else if (selectedBroker.value?.brokerName === 'Flattrade' || selectedBroker.value?.brokerName === 'Shoonya') {
    return dateString;
  }
  return dateString;
};
const convertToComparableDate = (dateString) => {
  const date = new Date(dateString);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-US', options).replace(/,/g, '');
};
const isExpiryToday = computed(() => {
  const comparableSelectedExpiry = convertToComparableDate(formatDate(selectedExpiry.value));
  const comparableFormattedDate = convertToComparableDate(formattedDate.value);
  // console.log('Comparable Selected Expiry:', comparableSelectedExpiry);
  // console.log('Comparable Formatted Date:', comparableFormattedDate);
  return comparableSelectedExpiry === comparableFormattedDate;
});

const filterStrikesByExpiry = (strikes, expiryDate) => {
  return strikes.filter(strike => strike.expiryDate === expiryDate);
};

const updateStrikesForExpiry = (expiryDate) => {
  let filteredCallStrikes = filterStrikesByExpiry(callStrikes.value, expiryDate);
  let filteredPutStrikes = filterStrikesByExpiry(putStrikes.value, expiryDate);

  // console.log('Filtered Call Strikes:', filteredCallStrikes);
  // console.log('Filtered Put Strikes:', filteredPutStrikes);

  // Only set initial strikes if they haven't been set yet or if the expiry date has changed
  if (!selectedCallStrike.value.securityId || !selectedPutStrike.value.securityId || selectedCallStrike.value.expiryDate !== expiryDate) {
    // Get the current underlying price based on the selected master symbol
    let currentPrice;
    if (selectedMasterSymbol.value === 'NIFTY') {
      currentPrice = parseFloat(niftyPrice.value);
    } else if (selectedMasterSymbol.value === 'BANKNIFTY') {
      currentPrice = parseFloat(bankNiftyPrice.value);
    } else if (selectedMasterSymbol.value === 'FINNIFTY') {
      currentPrice = parseFloat(finniftyPrice.value);
    } else if (selectedMasterSymbol.value === 'NIFTYNXT50') {
      currentPrice = parseFloat(niftynxt50Price.value);
    } else if (selectedMasterSymbol.value === 'MIDCPNIFTY') {
      currentPrice = parseFloat(midcpniftyPrice.value);
    } else if (selectedMasterSymbol.value === 'SENSEX') {
      currentPrice = parseFloat(sensexPrice.value);
    } else if (selectedMasterSymbol.value === 'BANKEX') {
      currentPrice = parseFloat(bankexPrice.value);
    } else if (selectedMasterSymbol.value === 'SENSEX50') {
      currentPrice = parseFloat(sensex50Price.value);
    }

    if (currentPrice && !isNaN(currentPrice) && filteredCallStrikes.length > 0) {
      const nearestStrike = filteredCallStrikes.reduce((prev, curr) =>
        Math.abs(curr.strikePrice - currentPrice) < Math.abs(prev.strikePrice - currentPrice) ? curr : prev
      );

      selectedCallStrike.value = nearestStrike;
      selectedPutStrike.value = filteredPutStrikes.find(strike => strike.strikePrice === nearestStrike.strikePrice) || {};
    }

    // console.log('Selected Call Strike:', selectedCallStrike.value);
    // console.log('Selected Put Strike:', selectedPutStrike.value);

    if (synchronizeOnLoad.value) {
      synchronizeStrikes();
      synchronizeOnLoad.value = false;
    }

    defaultCallSecurityId.value = selectedCallStrike.value.securityId || 'N/A';
    defaultPutSecurityId.value = selectedPutStrike.value.securityId || 'N/A';
  }
};
const synchronizeStrikes = () => {
  synchronizeCallStrikes();
  synchronizePutStrikes();
};

const synchronizeCallStrikes = () => {
  if (selectedPutStrike.value && selectedPutStrike.value.tradingSymbol) {
    let baseSymbol;
    if (selectedBroker.value?.brokerName === 'Dhan') {
      baseSymbol = selectedPutStrike.value.tradingSymbol.replace(/-PE$/, '');
    } else if (selectedBroker.value?.brokerName === 'Flattrade') {
      baseSymbol = selectedPutStrike.value.tradingSymbol.replace(/P\d+$/, '');
    } else if (selectedBroker.value?.brokerName === 'Shoonya') {
      baseSymbol = selectedPutStrike.value.tradingSymbol.replace(/P\d+$/, '');
    }
    const matchingCallStrike = callStrikes.value.find(strike =>
      strike.tradingSymbol.startsWith(baseSymbol) &&
      (selectedBroker.value?.brokerName === 'Dhan' ?
        strike.tradingSymbol.endsWith('-CE') :
        /C\d+$/.test(strike.tradingSymbol))
    );
    if (matchingCallStrike) {
      selectedCallStrike.value = matchingCallStrike;
    } else {
      selectedCallStrike.value = {};
    }
  }
  updateSecurityIds();
};

const synchronizePutStrikes = () => {
  if (selectedCallStrike.value && selectedCallStrike.value.tradingSymbol) {
    let baseSymbol;
    if (selectedBroker.value?.brokerName === 'Dhan') {
      baseSymbol = selectedCallStrike.value.tradingSymbol.replace(/-CE$/, '');
    } else if (selectedBroker.value?.brokerName === 'Flattrade') {
      baseSymbol = selectedCallStrike.value.tradingSymbol.replace(/C\d+$/, '');
    } else if (selectedBroker.value?.brokerName === 'Shoonya') {
      baseSymbol = selectedCallStrike.value.tradingSymbol.replace(/C\d+$/, '');
    }
    const matchingPutStrike = putStrikes.value.find(strike =>
      strike.tradingSymbol.startsWith(baseSymbol) &&
      (selectedBroker.value?.brokerName === 'Dhan' ?
        strike.tradingSymbol.endsWith('-PE') :
        /P\d+$/.test(strike.tradingSymbol))
    );
    if (matchingPutStrike) {
      selectedPutStrike.value = matchingPutStrike;
    } else {
      selectedPutStrike.value = {};
    }
  }
  updateSecurityIds();
};

const updateSecurityIds = () => {
  // console.log('Updating Security IDs');
  defaultCallSecurityId.value = selectedCallStrike.value.securityId || 'N/A';
  defaultPutSecurityId.value = selectedPutStrike.value.securityId || 'N/A';
};
const lotsPerSymbol = ref({});
const selectedLots = computed({
  get: () => lotsPerSymbol.value[selectedMasterSymbol.value] || 1,
  set: (value) => {
    lotsPerSymbol.value[selectedMasterSymbol.value] = value;
    saveLots();
  }
});
// Function to save lots to localStorage
const saveLots = () => {
  localStorage.setItem('lotsPerSymbol', JSON.stringify(lotsPerSymbol.value));
};

// Function to load lots from localStorage
const loadLots = () => {
  const savedLots = localStorage.getItem('lotsPerSymbol');
  if (savedLots) {
    lotsPerSymbol.value = JSON.parse(savedLots);
  }
};
// maxlots computation....
const maxLots = computed(() => {
  const instrument = quantities.value[selectedMasterSymbol.value];
  return instrument ? instrument.maxLots : 56; // maxlots 56 is conditional...
});
// Modify the updateAvailableQuantities function
const updateAvailableQuantities = () => {
  const instrument = quantities.value[selectedMasterSymbol.value];
  if (instrument) {
    availableQuantities.value = Array.from({ length: instrument.maxLots }, (_, i) => ({
      lots: i + 1,
      quantity: (i + 1) * instrument.lotSize
    }));
  } else {
    availableQuantities.value = [];
  }
  // Ensure selectedQuantity is in the available quantities list
  if (!availableQuantities.value.some(q => q.quantity === selectedQuantity.value)) {
    selectedQuantity.value = availableQuantities.value[0]?.quantity || 0;
  }
};
// Update the updateSelectedQuantity function
const updateSelectedQuantity = () => {
  const instrument = quantities.value[selectedMasterSymbol.value];
  if (instrument) {
    const maxLots = instrument.maxLots; // Use maxLots from the instrument
    const lots = Math.min(Math.max(1, selectedLots.value), maxLots);
    lotsPerSymbol.value[selectedMasterSymbol.value] = lots;
    selectedQuantity.value = lots * instrument.lotSize;
    saveLots();
  }
};

watch(selectedLots, () => {
  updateSelectedQuantity();
});

const handleHotKeys = (event) => {
  if (!enableHotKeys.value) return;

  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowRight':
    case 'ArrowLeft':
    case 'F6':
    case 'F7':
      event.preventDefault(); // Prevent default browser action
      break;
  }

  switch (event.key) {
    case 'ArrowUp':
      placeOrder(getTransactionType('BUY'), 'CALL');
      break;
    case 'ArrowDown':
      placeOrder(getTransactionType('BUY'), 'PUT');
      break;
    case 'ArrowRight':
      placeOrder(getTransactionType('SELL'), 'PUT');
      break;
    case 'ArrowLeft':
      placeOrder(getTransactionType('SELL'), 'CALL');
      break;
    case 'F6':
      closeAllPositions();
      break;
    case 'F7':
      cancelPendingOrders();
      break;
  }
};

const dhanOrders = ref([]);
const fetchDhanOrdersTradesBook = async () => {
  const dhanDetails = JSON.parse(localStorage.getItem('broker_Dhan') || '{}');

  try {
    const response = await axios.get('http://localhost:3000/dhanGetOrders', {
      params: {
        DHAN_API_TOKEN: dhanDetails.apiToken,
      }
    });
    dhanOrders.value = response.data; // Set the orders array
   // console.log('Dhan Order Book:', response.data);
  } catch (error) {
    console.error('Error fetching orders:', error);
    showToastMessage('Error fetching orders');
  }
};

const flatTradeBook = ref([]);
const token = ref('');
const flatOrderBook = ref([]);
const fetchFlattradeOrdersTradesBook = async () => {
  let jKey = localStorage.getItem('FLATTRADE_API_TOKEN') || token.value;

  if (!selectedBroker.value || selectedBroker.value?.brokerName !== 'Flattrade') {
    showToastMessage('Flattrade broker is not selected.');
    return;
  }

  const clientId = selectedBroker.value.clientId;

  if (!jKey || !clientId) {
    showToastMessage('Token or Client ID is missing. Please generate a token first.');
    return;
  }

  try {
    const response = await axios.get('http://localhost:3000/flattradeGetOrdersAndTrades', {
      params: {
        FLATTRADE_API_TOKEN: jKey,
        FLATTRADE_CLIENT_ID: clientId
      }
    });

    flatOrderBook.value = response.data.orderBook;
    flatTradeBook.value = response.data.tradeBook;
    // console.log('Flattrade Order Book:', response.data.orderBook);
    // console.log('Flattrade Trade Book:', response.data.tradeBook);
  } catch (error) {
    showToastMessage('Error fetching trades: ' + error.message);
    console.error('Error fetching trades:', error);
  }
};

const shoonyaOrderBook = ref([]);
const shoonyaTradeBook = ref([]);
const fetchShoonyaOrdersTradesBook = async () => {
  let jKey = localStorage.getItem('SHOONYA_API_TOKEN') || token.value;

  if (!selectedBroker.value || selectedBroker.value?.brokerName !== 'Shoonya') {
    showToastMessage('Shoonya broker is not selected.');
    return;
  }

  const clientId = selectedBroker.value.clientId;

  if (!jKey || !clientId) {
    showToastMessage('Token or Client ID is missing. Please generate a token first.');
    return;
  }

  try {
    const response = await axios.get('http://localhost:3000/shoonyaGetOrdersAndTrades', {
      params: {
        SHOONYA_API_TOKEN: jKey,
        SHOONYA_CLIENT_ID: clientId
      }
    });

    shoonyaOrderBook.value = response.data.orderBook;
    shoonyaTradeBook.value = response.data.tradeBook;
    // console.log('Shoonya Order Book:', response.data.orderBook);
    // console.log('Shoonya Trade Book:', response.data.tradeBook);
  } catch (error) {
    showToastMessage('Error fetching trades: ' + error.message);
    console.error('Error fetching trades:', error);
  }
};

const combinedOrdersAndTrades = computed(() => {
  const combined = {};

  if (selectedBroker.value?.brokerName === 'Flattrade') {
    // Process Flattrade orders and trades
    if (Array.isArray(flatOrderBook.value)) {
      flatOrderBook.value.forEach(order => {
        combined[order.norenordno] = { order, trade: null };
      });
    }

    if (Array.isArray(flatTradeBook.value)) {
      flatTradeBook.value.forEach(trade => {
        if (combined[trade.norenordno]) {
          combined[trade.norenordno].trade = trade;
        } else {
          combined[trade.norenordno] = { order: null, trade };
        }
      });
    }
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    // Process Shoonya orders and trades
    if (Array.isArray(shoonyaOrderBook.value)) {
      shoonyaOrderBook.value.forEach(order => {
        combined[order.norenordno] = { order, trade: null };
      });
    }

    if (Array.isArray(shoonyaTradeBook.value)) {
      shoonyaTradeBook.value.forEach(trade => {
        if (combined[trade.norenordno]) {
          combined[trade.norenordno].trade = trade;
        } else {
          combined[trade.norenordno] = { order: null, trade };
        }
      });
    }
  }

  return Object.values(combined).sort((a, b) => {
    const aTime = a.order?.norentm || a.trade?.norentm;
    const bTime = b.order?.norentm || b.trade?.norentm;
    return new Date(bTime) - new Date(aTime); // Sort in descending order (most recent first)
  });
});

const formatTime = (timeString) => {
  if (!timeString) return '';

  let timePart;

  if (selectedBroker.value?.brokerName === 'Dhan') {
    timePart = timeString.split(' ')[1];
  } else if (selectedBroker.value?.brokerName === 'Flattrade' || selectedBroker.value?.brokerName === 'Shoonya') {
    timePart = timeString.split(' ')[0];
  } else {
    return timeString;
  }

  const [hours, minutes, seconds] = timePart.split(':');
  
  let formattedHours = parseInt(hours, 10);
  const ampm = formattedHours >= 12 ? 'PM' : 'AM';
  formattedHours = formattedHours % 12 || 12;

  return `${formattedHours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
};

const dhanPositionBook = ref([]);
const fetchDhanPositions = async () => {
  const dhanDetails = JSON.parse(localStorage.getItem('broker_Dhan') || '{}');
  if (!dhanDetails.apiToken) {
    showToastMessage('Dhan API Token is missing. Please generate a token first.');
    return;
  }
  try {
    const response = await axios.get('http://localhost:3000/dhanPositions', {
      params: {
        DHAN_API_TOKEN: dhanDetails.apiToken,
      }
    });
    dhanPositionBook.value = response.data;
    // console.log('Dhan Position Book:', dhanPositionBook.value);
  } catch (error) {
    console.error('Error fetching dhanPositionBook:', error);
    showToastMessage('Failed to fetch dhanPositionBook');
  }
};

const flatTradePositionBook = ref([]);
const fetchFlattradePositions = async () => {
  let jKey = localStorage.getItem('FLATTRADE_API_TOKEN') || token.value;

  if (!jKey) {
    showToastMessage('Token is missing. Please generate a token first.');
    return;
  }

  if (!selectedBroker.value || selectedBroker.value?.brokerName !== 'Flattrade') {
    showToastMessage('Flattrade broker is not selected.');
    return;
  }

  const clientId = selectedBroker.value.clientId;

  const positionBookPayload = `jKey=${jKey}&jData=${JSON.stringify({ uid: clientId, actid: clientId })}`;

  try {
    const positionBookRes = await axios.post('https://piconnect.flattrade.in/PiConnectTP/PositionBook', positionBookPayload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (Array.isArray(positionBookRes.data) && positionBookRes.data.every(item => item.stat === 'Ok')) {
      flatTradePositionBook.value = positionBookRes.data;
      // console.log('Flattrade Position Book:', positionBookRes.data);
      updatePositionSecurityIds();
      subscribeToPositionLTPs();
      subscribeToOptions();
    } else if (positionBookRes.data.emsg === 'no data' || positionBookRes.data.emsg.includes('no data')) {
      flatTradePositionBook.value = [];
      // console.log('No positions in Flattrade Position Book');
    } else {
      const errorMsg = positionBookRes.data.emsg || 'Unknown error';
      console.error('Error fetching position book:', errorMsg);
      flatTradePositionBook.value = [];
    }
  } catch (error) {
    console.error('Error fetching position book:', error);
    flatTradePositionBook.value = [];
  }
};

const shoonyaPositionBook = ref([]);
const fetchShoonyaPositions = async () => {
  let jKey = localStorage.getItem('SHOONYA_API_TOKEN') || token.value;

  if (!jKey) {
    showToastMessage('Token is missing. Please generate a token first.');
    return;
  }

  if (!selectedBroker.value || selectedBroker.value?.brokerName !== 'Shoonya') {
    showToastMessage('Shoonya broker is not selected.');
    return;
  }

  const clientId = selectedBroker.value.clientId;

  const positionBookPayload = `jKey=${jKey}&jData=${JSON.stringify({ uid: clientId, actid: clientId })}`;

  try {
    const positionBookRes = await axios.post('https://api.shoonya.com/NorenWClientTP/PositionBook', positionBookPayload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (Array.isArray(positionBookRes.data) && positionBookRes.data.every(item => item.stat === 'Ok')) {
      shoonyaPositionBook.value = positionBookRes.data;
      // console.log('Shoonya Position Book:', positionBookRes.data);
      updatePositionSecurityIds();
      subscribeToPositionLTPs();
      subscribeToOptions();
    } else if (positionBookRes.data.emsg === 'no data' || positionBookRes.data.emsg.includes('no data')) {
      shoonyaPositionBook.value = [];
      // console.log('No positions in Shoonya Position Book');
    } else {
      const errorMsg = positionBookRes.data.emsg || 'Unknown error';
      console.error('Error fetching position book:', errorMsg);
      shoonyaPositionBook.value = [];
    }
  } catch (error) {
    console.error('Error fetching position book:', error);
    shoonyaPositionBook.value = [];
  }
};

const sortedPositions = computed(() => {
  return [...positionsWithCalculatedProfit.value].sort((a, b) => {
    // First, sort by open/closed status
    if (Number(a.netqty) !== 0 && Number(b.netqty) === 0) return -1;
    if (Number(a.netqty) === 0 && Number(b.netqty) !== 0) return 1;

    // Then, for open positions, sort by absolute quantity in descending order
    if (Number(a.netqty) !== 0 && Number(b.netqty) !== 0) {
      return Math.abs(Number(b.netqty)) - Math.abs(Number(a.netqty));
    }

    // For closed positions, maintain their original order
    return 0;
  });
});

const fundLimits = ref({});
// Update the fetchFundLimit function
const fetchFundLimit = async () => {
  try {
    if (!selectedBroker.value) {
      throw new Error('No broker selected');
    }

    let response;
    if (selectedBroker.value?.brokerName === 'Dhan') {
      const dhanDetails = JSON.parse(localStorage.getItem('broker_Dhan') || '{}');
      if (!dhanDetails.apiToken) {
        throw new Error('Dhan API Token is missing');
      }
      response = await axios.get('http://localhost:3000/dhanFundLimit', {
        params: {
          DHAN_API_TOKEN: dhanDetails.apiToken,
        }
      });
    }
    else if (selectedBroker.value?.brokerName === 'Flattrade') {
      const FLATTRADE_API_TOKEN = localStorage.getItem('FLATTRADE_API_TOKEN');
      if (!FLATTRADE_API_TOKEN) {
        throw new Error('Flattrade API Token is missing');
      }
      response = await axios.post('http://localhost:3000/flattradeFundLimit', null, {
        params: {
          FLATTRADE_API_TOKEN,
          FLATTRADE_CLIENT_ID: selectedBroker.value.clientId
        }
      });
    }
    else if (selectedBroker.value?.brokerName === 'Shoonya') {
      const SHOONYA_API_TOKEN = localStorage.getItem('SHOONYA_API_TOKEN');
      if (!SHOONYA_API_TOKEN) {
        throw new Error('Shoonya API Token is missing');
      }
      response = await axios.post('http://localhost:3000/shoonyaFundLimit', null, {
        params: {
          SHOONYA_API_TOKEN,
          SHOONYA_CLIENT_ID: selectedBroker.value.clientId
        }
      });
      // Make sure the response data has the correct structure
      fundLimits.value = {
        cash: response.data.cash,
        marginused: response.data.marginused
        // Add any other relevant fields from the Shoonya response
      };
    }
    else {
      throw new Error('Unsupported broker');
    }
    fundLimits.value = response.data;
  } catch (error) {
    console.error('Failed to fetch fund limits:', error);
  }
};
const updateFundLimits = async () => {
  await fetchFundLimit();
  // console.log('Updated Fund Limits:', fundLimits.value);
};
const showBrokerClientId = ref(false);
const toggleBrokerClientIdVisibility = () => {
  showBrokerClientId.value = !showBrokerClientId.value;
};

const maskBrokerClientId = (clientId) => {
  if (!clientId) return 'N/A';
  const length = clientId.length;
  if (length <= 2) return clientId;
  const maskLength = Math.max(1, Math.floor(length / 2));
  const startUnmaskedLength = Math.ceil((length - maskLength) / 2);
  const endUnmaskedLength = length - startUnmaskedLength - maskLength;
  const firstPart = clientId.slice(0, startUnmaskedLength);
  const lastPart = clientId.slice(-endUnmaskedLength);
  const middleMask = '*'.repeat(maskLength);
  return `${firstPart}${middleMask}${lastPart}`;
};

// Refresh selected tab...
const refreshData = async () => {
  if (activeTab.value === 'trades') {
    if (selectedBroker.value?.brokerName === 'Dhan') {
      await fetchDhanOrdersTradesBook();
    } else if (selectedBroker.value?.brokerName === 'Flattrade') {
      await fetchFlattradeOrdersTradesBook();
    } else if (selectedBroker.value?.brokerName === 'Shoonya') {
      await fetchShoonyaOrdersTradesBook();
    }
  } else if (activeTab.value === 'positions') {
    if (selectedBroker.value?.brokerName === 'Dhan') {
      await fetchDhanPositions();
    } else if (selectedBroker.value?.brokerName === 'Flattrade') {
      await fetchFlattradePositions();
    } else if (selectedBroker.value?.brokerName === 'Shoonya') {
      await fetchShoonyaPositions();
    }
  }
  await updateFundLimits();
};

// Update the quantities object
const quantities = ref({
  NIFTY: { lotSize: 25, maxLots: 72 },
  BANKNIFTY: { lotSize: 15, maxLots: 60 },
  FINNIFTY: { lotSize: 25, maxLots: 72 },
  MIDCPNIFTY: { lotSize: 50, maxLots: 56 },
  NIFTYNXT50: { lotSize: 10, maxLots: 60 },
  SENSEX: { lotSize: 10, maxLots: 100 },
  BANKEX: { lotSize: 15, maxLots: 60 },
  SENSEX50: { lotSize: 25, maxLots: 72 }
});
const availableQuantities = ref([]);

const orderTypes = computed(() => {
  if (selectedBroker.value?.brokerName === 'Dhan') {
    return ['MARKET', 'LIMIT', 'STOP_LOSS','MARKET AS LIMIT'];
  } else if (selectedBroker.value?.brokerName === 'Flattrade') {
    return ['MKT', 'LMT','SL-LMT','MARKET AS LIMIT'];
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    return ['MKT', 'LMT','SL-LMT','MARKET AS LIMIT'];
  }
  return [];
});
const selectedOrderType = ref(orderTypes.value[0]);
const previousOrderType = ref(orderTypes.value[0]);

const selectedStrike = ref({});
const setOrderDetails = (transactionType, optionType) => {
  modalTransactionType.value = getTransactionType(transactionType); // Use getTransactionType to set modalTransactionType
  modalOptionType.value = optionType;
  selectedOrderType.value = orderTypes.value[1]; // Set selectedOrderType to LIMIT or LMT based on broker
  selectedStrike.value = optionType === 'CALL' ? selectedCallStrike.value : selectedPutStrike.value;
};
const setStopLossLimitOrderDetails = (transactionType, optionType) => {
  modalTransactionType.value = getTransactionType(transactionType); // Use getTransactionType to set modalTransactionType
  modalOptionType.value = optionType;
  selectedOrderType.value = orderTypes.value[2]; // Set selectedOrderType to STOP_LOSS or SL-LMT based on broker
  selectedStrike.value = optionType === 'CALL' ? selectedCallStrike.value : selectedPutStrike.value;
};
const resetOrderTypeIfNeeded = () => {
  if (previousOrderType.value === orderTypes.value[0]) { // Check if previousOrderType is MARKET or MKT
    resetOrderType();
  }
};

const resetOrderType = () => {
  selectedOrderType.value = orderTypes.value[0]; // Set selectedOrderType to MARKET or MKT based on broker
};

const productTypes = computed(() => {
  if (selectedBroker.value?.brokerName === 'Dhan') {
    return ['Intraday', 'Margin'];
  }
  else if (selectedBroker.value?.brokerName === 'Flattrade') {
    return ['Intraday', 'Margin'];
  }
  else if (selectedBroker.value?.brokerName === 'Shoonya') {
    return ['Intraday', 'Margin'];
  }
  return [];
});
const getProductTypeValue = (productType) => {
  if (selectedBroker.value?.brokerName === 'Dhan') {
    return productType.toUpperCase();
  } else if (selectedBroker.value?.brokerName === 'Flattrade') {
    return productType === 'Intraday' ? 'I' : 'M';
  }
  else if (selectedBroker.value?.brokerName === 'Shoonya') {
    return productType === 'Intraday' ? 'I' : 'M';
  }
  return productType;
};

const selectedProductType = ref(''); // Initialize with an empty string

const getTransactionType = (type) => {
  if (selectedBroker.value?.brokerName === 'Dhan') {
    return type;
  } else if (selectedBroker.value?.brokerName === 'Flattrade') {
    return type === 'BUY' ? 'B' : 'S';
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    return type === 'BUY' ? 'B' : 'S';
  }
  return type;
};

const marketProtectionPercentage = ref(0);
const limitPrice = ref(null);
const stopLossLimitPrice = ref(null);
const triggerPrice = ref(null);
const modalTransactionType = ref('');
const modalOptionType = ref('');
const isOrderModifying = computed(() => (orderId) => !!modifyingOrders[orderId]);
const isMarketOrder = computed(() => {
  if (selectedBroker.value?.brokerName === 'Dhan') {
    return selectedOrderType.value === 'MARKET';
  } else if (selectedBroker.value?.brokerName === 'Flattrade' || selectedBroker.value?.brokerName === 'Shoonya') {
    return selectedOrderType.value === 'MKT';
  }
  return false;
});
const isMarketAsLimitOrder = computed(() => {
  return selectedOrderType.value === 'MARKET AS LIMIT';
});
const modifiedPrice = ref(null);
const modifiedTriggerPrice = ref(null);
const modifiedQuantities = ref(null);
const modifiedOrderType = ref({});  
const modifyingOrders = reactive({});
const modifiedOrderData = reactive({});

const isOrderModified = (orderId) => {
  const original = selectedBroker.value?.brokerName === 'Dhan'
    ? dhanOrders.value.find(order => order.orderId === orderId)
    : (activeFetchFunction.value === 'fetchFlattradeOrdersTradesBook' ? flatOrderBook.value : shoonyaOrderBook.value).find(order => order.norenordno === orderId);
  const modified = modifiedOrderData[orderId];

  if (!original || !modified) return false;

  const isDhan = selectedBroker.value?.brokerName === 'Dhan';

  const orderTypeChanged = (isDhan ? original.orderType : original.prctyp) !== modified.modifiedOrderType;
  const quantityChanged = Number(isDhan ? original.quantity : original.qty) !== Number(modified.modifiedQuantity);
  const priceChanged = Number(isDhan ? original.price : original.prc) !== Number(modified.modifiedPrice);
  
  let triggerPriceChanged = false;
  if (isDhan && original.orderType === 'STOP_LOSS') {
    triggerPriceChanged = Number(original.triggerPrice || 0) !== Number(modified.modifiedTriggerPrice || 0);
  } else if (!isDhan && original.prctyp === 'SL-LMT') {
    triggerPriceChanged = Number(original.trgprc || 0) !== Number(modified.modifiedTriggerPrice || 0);
  }

  return orderTypeChanged || quantityChanged || priceChanged || triggerPriceChanged;
};

const setModifyOrder = (orderId) => {
  let order;
  if (selectedBroker.value?.brokerName === 'Dhan') {
    order = dhanOrders.value.find(o => o.orderId === orderId);
  } else if (selectedBroker.value?.brokerName === 'Flattrade') {
    order = flatOrderBook.value.find(o => o.norenordno === orderId);
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    order = shoonyaOrderBook.value.find(o => o.norenordno === orderId);
  }

  if (order) {
    modifiedOrderData[orderId] = {
      modifiedOrderType: selectedBroker.value?.brokerName === 'Dhan' ? order.orderType : order.prctyp,
      modifiedQuantity: selectedBroker.value?.brokerName === 'Dhan' ? order.quantity : order.qty,
      modifiedPrice: selectedBroker.value?.brokerName === 'Dhan' ? order.price : order.prc,
      modifiedTriggerPrice: selectedBroker.value?.brokerName === 'Dhan' ? order.triggerPrice : order.trgprc,
      exch: order.exch,
      tsym: selectedBroker.value?.brokerName === 'Dhan' ? order.tradingSymbol : order.tsym
    };
    modifyingOrders[orderId] = true;
    // console.log(`Set modify order for ${orderId}:`, modifiedOrderData[orderId]);
  } else {
    console.error(`Order not found for ID: ${orderId}`);
  }
};

const cancelModifyOrder = (orderId) => {
  modifyingOrders[orderId] = false;
  delete modifiedOrderData[orderId];
};
const isInputValid = (orderId) => {
  const modified = modifiedOrderData[orderId];
  const isValidQuantity = Number.isInteger(modified.modifiedQuantity) && modified.modifiedQuantity > 0;
  const isValidPrice = modified.modifiedOrderType === 'MARKET' || modified.modifiedOrderType === 'MKT' || 
    (modified.modifiedPrice > 0 && !isNaN(modified.modifiedPrice));
  const isValidTriggerPrice = modified.modifiedOrderType !== 'STOP_LOSS' && modified.modifiedOrderType !== 'SL-LMT' || 
    (modified.modifiedTriggerPrice > 0 && !isNaN(modified.modifiedTriggerPrice));

  return isValidQuantity && isValidPrice && isValidTriggerPrice;
};

const validateInput = (order, field) => {
  const orderId = order.orderId || order.norenordno;
  const value = modifiedOrderData[orderId][field];

  if (field === 'modifiedQuantity') {
    modifiedOrderData[orderId][field] = Math.max(1, Math.floor(Number(value)));
  } else if (field === 'modifiedPrice' || field === 'modifiedTriggerPrice') {
    modifiedOrderData[orderId][field] = Math.max(0, Number(parseFloat(value).toFixed(2)));
  }
  // console.log(`Updated ${field} for order ${orderId}:`, modifiedOrderData[orderId][field]);
};
const handleOrderTypeChange = (order) => {
  const orderId = order.orderId || order.norenordno;
  const isDhan = selectedBroker.value?.brokerName === 'Dhan';

  if (isDhan) {
    if (modifiedOrderData[orderId].modifiedOrderType === 'MARKET') {
      modifiedOrderData[orderId].modifiedPrice = 0;
      modifiedOrderData[orderId].modifiedTriggerPrice = 0;
    } else if (modifiedOrderData[orderId].modifiedOrderType === 'LIMIT') {
      modifiedOrderData[orderId].modifiedTriggerPrice = 0;
    } else if (modifiedOrderData[orderId].modifiedOrderType === 'STOP_LOSS') {
      if (modifiedOrderData[orderId].modifiedTriggerPrice === 0) {
        modifiedOrderData[orderId].modifiedTriggerPrice = order.triggerPrice || 0;
      }
    }
  } else {
    if (modifiedOrderData[orderId].modifiedOrderType === 'MKT') {
      modifiedOrderData[orderId].modifiedPrice = 0;
      modifiedOrderData[orderId].modifiedTriggerPrice = 0;
    } else if (modifiedOrderData[orderId].modifiedOrderType === 'LMT') {
      modifiedOrderData[orderId].modifiedTriggerPrice = 0;
    } else if (modifiedOrderData[orderId].modifiedOrderType === 'SL-LMT' || modifiedOrderData[orderId].modifiedOrderType === 'SL-MKT') {
      if (modifiedOrderData[orderId].modifiedTriggerPrice === 0) {
        modifiedOrderData[orderId].modifiedTriggerPrice = order.trgprc || 0;
      }
    }
  }
};
const handleTriggerPriceChange = (order) => {
  const orderId = order.orderId || order.norenordno;
  const triggerPrice = parseFloat(modifiedOrderData[orderId].modifiedTriggerPrice);
  if (!isNaN(triggerPrice)) {
    const adjustment = Math.ceil(triggerPrice * 0.01);
    if (order.transactionType === 'BUY' || order.trantype === 'B') {
      modifiedOrderData[orderId].modifiedPrice = roundToNearestTick(triggerPrice + adjustment, 0.05).toFixed(2);
    } else if (order.transactionType === 'SELL' || order.trantype === 'S') {
      modifiedOrderData[orderId].modifiedPrice = roundToNearestTick(triggerPrice - adjustment, 0.05).toFixed(2);
    }
  }
};

// Get Exchange Segment for Dhan or Flattrade
const getExchangeSegment = () => {
  if (!selectedBroker.value || !selectedExchange.value) {
    throw new Error("Broker or exchange not selected");
  }

  if (selectedBroker.value?.brokerName === 'Dhan') {
    if (selectedExchange.value === 'NSE') {
      return { segment: 'NSE_FNO', dhanExchangeSegment: "0" };
    } else if (selectedExchange.value === 'BSE') {
      return { segment: 'BSE_FNO', dhanExchangeSegment: "1" };
    } else {
      throw new Error("Selected exchange is not valid for Dhan");
    }
  } else if (selectedBroker.value?.brokerName === 'Flattrade') {
    if (selectedExchange.value === 'NFO') {
      return { segment: 'NFO' };
    } else if (selectedExchange.value === 'BFO') {
      return { segment: 'BFO' };
    } else {
      throw new Error("Selected exchange is not valid for Flattrade");
    }
  }
  else if (selectedBroker.value?.brokerName === 'Shoonya') {
    if (selectedExchange.value === 'NFO') {
      return { segment: 'NFO' };
    } else if (selectedExchange.value === 'BFO') {
      return { segment: 'BFO' };
    } else {
      throw new Error("Selected exchange is not valid for Shoonya");
    }
  }
  else {
    throw new Error("Unsupported broker");
  }
};

const calculateProtectedPrice = (currentLTP, transactionType, protectionPercentage) => {
  const protectionFactor = 1 + (protectionPercentage / 100);
  if (transactionType === 'BUY' || transactionType === 'B') {
    return currentLTP * protectionFactor;
  } else {
    return currentLTP / protectionFactor;
  }
};

const roundToNearestTick = (price, tickSize) => {
  return Math.round(price / tickSize) * tickSize;
};

// Prepare Order Payload for Dhan or Flattrade
const prepareOrderPayload = (transactionType, drvOptionType, selectedStrike, exchangeSegment) => {
  const currentLTP = drvOptionType === 'CALL' ? latestCallLTP.value : latestPutLTP.value;
  const isMarketProtection = isMarketAsLimitOrder.value;
  let protectedPrice;

  if (isMarketProtection) {
    if (marketProtectionPercentage.value > 0) {
      protectedPrice = calculateProtectedPrice(currentLTP, transactionType, marketProtectionPercentage.value);
    } else {
      const defaultOffset = 0.0;
      protectedPrice = transactionType === 'BUY' ? currentLTP * (1 + defaultOffset) : currentLTP * (1 - defaultOffset);
    }
  } else {
    protectedPrice = currentLTP;
  }

  protectedPrice = roundToNearestTick(protectedPrice, 0.05);

  if (selectedBroker.value?.brokerName === 'Dhan') {
    return {
      brokerClientId: selectedBroker.value.brokerClientId,
      transactionType: transactionType,
      exchangeSegment: exchangeSegment,
      productType: selectedProductType.value,
      orderType: selectedOrderType.value,
      validity: 'DAY',
      tradingSymbol: selectedStrike.tradingSymbol,
      securityId: selectedStrike.securityId,
      quantity: selectedQuantity.value,
      price: selectedOrderType.value === 'STOP_LOSS' ? stopLossLimitPrice.value :
             selectedOrderType.value === 'LIMIT' ? limitPrice.value :
             isMarketAsLimitOrder.value ? protectedPrice : 0,
      triggerPrice: selectedOrderType.value === 'STOP_LOSS' ? triggerPrice.value : 0,
      drvExpiryDate: selectedExpiry.value,
      drvOptionType: drvOptionType
    };
  } else if (selectedBroker.value?.brokerName === 'Flattrade' || selectedBroker.value?.brokerName === 'Shoonya') {
    return {
      uid: selectedBroker.value.brokerClientId,
      actid: selectedBroker.value.brokerClientId,
      exch: exchangeSegment,
      tsym: selectedStrike.tradingSymbol,
      qty: selectedQuantity.value,
      prc: selectedOrderType.value === 'SL-LMT' ? stopLossLimitPrice.value :
           selectedOrderType.value === 'LMT' ? limitPrice.value :
           isMarketAsLimitOrder.value ? protectedPrice : 0,
      trgprc: selectedOrderType.value === 'SL-LMT' ? triggerPrice.value : 0,
      prd: selectedProductType.value,
      trantype: transactionType,
      prctyp: isMarketAsLimitOrder.value ? 'LMT' : selectedOrderType.value,
      ret: "DAY"
    };
  } else {
    throw new Error("Unsupported broker");
  }
};
  
// With a reactive object
// Modify the tradeSettings reactive object
const tradeSettings = reactive({
  enableStoploss: JSON.parse(localStorage.getItem('enableStoploss') || 'true'),
  stoplossValue: Number(localStorage.getItem('stoplossValue') || '20'),
  enableTarget: JSON.parse(localStorage.getItem('enableTarget') || 'true'),
  targetValue: Number(localStorage.getItem('targetValue') || '30'),
  stoplossStep: 1, // The step size for increasing/decreasing stoploss price
  targetStep: 1, // The step size for increasing/decreasing target price
});
// Add this function to save trade settings to localStorage
const saveTradeSettings = () => {
  localStorage.setItem('enableStoploss', JSON.stringify(tradeSettings.enableStoploss));
  localStorage.setItem('stoplossValue', tradeSettings.stoplossValue.toString());
  localStorage.setItem('enableTarget', JSON.stringify(tradeSettings.enableTarget));
  localStorage.setItem('targetValue', tradeSettings.targetValue.toString());
};
// Add these to your existing reactive variables
const positionStoplosses = ref({});
const positionTargets = ref({});
// Add these to your reactive variables
const positionStoplossesPrice = ref({});
const positionTargetsPrice = ref({});
// Add these helper functions
const adjustStoplossPrice = (tsym, adjustment) => {
  if (!tsym || !positionStoplossesPrice.value[tsym]) return;

  const position = [...flatTradePositionBook.value, ...shoonyaPositionBook.value, ...dhanPositionBook.value]
    .find(p => getSymbol(p) === tsym);

  if (!position) return;

  const netQty = Number(position.netQty || position.netqty);
  const isLong = netQty > 0;

  // For long positions, decrease stoploss price. For short positions, increase it.
  positionStoplossesPrice.value[tsym] += isLong ? -adjustment : adjustment;

  // Recalculate the points-based stoploss
  const currentLTP = Number(positionLTPs.value[tsym] || 0);
  positionStoplosses.value[tsym] = Math.abs(currentLTP - positionStoplossesPrice.value[tsym]);

  // console.log(`Adjusted stoploss for ${tsym}: Price=${positionStoplossesPrice.value[tsym]}, Points=${positionStoplosses.value[tsym]}`);

  localStorage.setItem('positionStoplossesPrice', JSON.stringify(positionStoplossesPrice.value));
  localStorage.setItem('positionStoplosses', JSON.stringify(positionStoplosses.value));
};

const adjustTargetPrice = (tsym, adjustment) => {
  if (!tsym || !positionTargetsPrice.value[tsym]) return;

  const position = [...flatTradePositionBook.value, ...shoonyaPositionBook.value, ...dhanPositionBook.value]
    .find(p => getSymbol(p) === tsym);

  if (!position) return;

  const netQty = Number(position.netQty || position.netqty);
  const isLong = netQty > 0;

  // For long positions, increase target price. For short positions, decrease it.
  positionTargetsPrice.value[tsym] += isLong ? adjustment : -adjustment;

  // Recalculate the points-based target
  const currentLTP = Number(positionLTPs.value[tsym] || 0);
  positionTargets.value[tsym] = Math.abs(currentLTP - positionTargetsPrice.value[tsym]);

  // console.log(`Adjusted target for ${tsym}: Price=${positionTargetsPrice.value[tsym]}, Points=${positionTargets.value[tsym]}`);

  localStorage.setItem('positionTargetsPrice', JSON.stringify(positionTargetsPrice.value));
  localStorage.setItem('positionTargets', JSON.stringify(positionTargets.value));
};

// Place Order for Dhan, Flattrade or Shoonya
const placeOrder = async (transactionType, drvOptionType) => {
  try {
    let selectedStrike;
    if (drvOptionType === 'CALL') {
      selectedStrike = selectedCallStrike.value;
    } else if (drvOptionType === 'PUT') {
      selectedStrike = selectedPutStrike.value;
    }

    if (!selectedStrike) {
      throw new Error(`Selected ${drvOptionType.toLowerCase()} strike is not defined`);
    }

    if (!selectedStrike.tradingSymbol || !selectedStrike.securityId) {
      throw new Error(`Selected ${drvOptionType.toLowerCase()} strike properties are not properly defined`);
    }

    const exchangeSegment = getExchangeSegment().segment;
    const orderData = prepareOrderPayload(transactionType, drvOptionType, selectedStrike, exchangeSegment);

    console.log("Placing order with data:", orderData);
    let response;
    if (selectedBroker.value?.brokerName === 'Dhan') {
      const dhanDetails = JSON.parse(localStorage.getItem('broker_Dhan') || '{}');

      response = await axios.post('http://localhost:3000/dhanPlaceOrder', orderData, {
        params: {
          DHAN_API_TOKEN: dhanDetails.apiToken
        }
      });
    }
    else if (selectedBroker.value?.brokerName === 'Flattrade') {
      const FLATTRADE_API_TOKEN = localStorage.getItem('FLATTRADE_API_TOKEN');
      const payload = qs.stringify({
        ...orderData,
        uid: selectedBroker.value.clientId,
        actid: selectedBroker.value.clientId
      });
      response = await axios.post('http://localhost:3000/flattradePlaceOrder', payload, {
        headers: {
          'Authorization': `Bearer ${FLATTRADE_API_TOKEN}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    }
    else if (selectedBroker.value?.brokerName === 'Shoonya') {
      const SHOONYA_API_TOKEN = localStorage.getItem('SHOONYA_API_TOKEN');
      const payload = qs.stringify({
        ...orderData,
        uid: selectedBroker.value.clientId,
        actid: selectedBroker.value.clientId
      });
      response = await axios.post('http://localhost:3000/shoonyaPlaceOrder', payload, {
        headers: {
          'Authorization': `Bearer ${SHOONYA_API_TOKEN}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    }

    // console.log("Order placed successfully:", response.data);
    showToastMessage('Order placed successfully');
    // Add a delay before fetching updated data
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update both orders and positions
    await updateOrdersAndPositions();

    // Update fund limits
    await updateFundLimits()

    // Set stoploss and target for the new position
    const newPosition = findNewPosition(selectedStrike.tradingSymbol);
    if (newPosition) {
      setStoplossAndTarget(newPosition);
    }

  } catch (error) {
    console.error("Error placing order:", error); // Log the full error
    if (error.response && error.response.data && error.response.data.message) {
      const firstThreeWords = error.response.data.message.split(' ').slice(0, 3).join(' ');
      showToastMessage(firstThreeWords);
    } else {
      showToastMessage('Failed to place order unfortunately');
    }
  }
};

// New function to update both orders and positions
const updateOrdersAndPositions = async () => {
  if (selectedBroker.value?.brokerName === 'Dhan') {
    await Promise.all([
      fetchDhanOrdersTradesBook(),
      fetchDhanPositions()
    ]);
  } else if (selectedBroker.value?.brokerName === 'Flattrade') {
    await Promise.all([
      fetchFlattradeOrdersTradesBook(),
      fetchFlattradePositions()
    ]);
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    await Promise.all([
      fetchShoonyaOrdersTradesBook(),
      fetchShoonyaPositions()
    ]);
  }
};

// Add this helper function to find the new position
const findNewPosition = (tradingSymbol) => {
  if (selectedBroker.value?.brokerName === 'Flattrade') {
    return flatTradePositionBook.value.find(p => p.tsym === tradingSymbol);
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    return shoonyaPositionBook.value.find(p => p.tsym === tradingSymbol);
  } else if (selectedBroker.value?.brokerName === 'Dhan') {
    return dhanPositionBook.value.find(p => p.tradingSymbol === tradingSymbol);
  }
  return null;
};

// Place Order for Dhan, Flattrade, or Shoonya for each position
const placeOrderForPosition = async (transactionType, optionType, position) => {
  try {
    const quantity = Math.abs(Number(position.netQty || position.netqty));

    if (quantity === 0) {
      // console.log('Quantity is zero, no order will be placed.');
      return;
    }

    let orderData;
    if (selectedBroker.value?.brokerName === 'Dhan') {
      orderData = {
        brokerClientId: selectedBroker.value.clientId,
        transactionType: transactionType,
        exchangeSegment: selectedExchange.value === 'NSE' ? 'NSE_FNO' : 'BSE_FNO',
        productType: position.productType || selectedProductType.value,
        orderType: 'MARKET',
        validity: 'DAY',
        tradingSymbol: position.tradingSymbol,
        securityId: position.securityId,
        quantity: quantity,
        price: 0,
        drvExpiryDate: position.expiryDate,
        drvOptionType: optionType
      };
    } else if (selectedBroker.value?.brokerName === 'Flattrade' || selectedBroker.value?.brokerName === 'Shoonya') {
      orderData = {
        uid: selectedBroker.value.clientId,
        actid: selectedBroker.value.clientId,
        exch: selectedExchange.value === 'NFO' ? 'NFO' : 'BFO',
        tsym: position.tsym,
        qty: quantity.toString(),
        prc: "0",
        prd: position.prd,
        trantype: transactionType,
        prctyp: 'MKT',
        ret: "DAY"
      };
    }

    console.log("Placing order for position with data:", orderData);
    let response;
    if (selectedBroker.value?.brokerName === 'Dhan') {
      response = await axios.post('http://localhost:3000/dhanPlaceOrder', orderData);
    }
    else if (selectedBroker.value?.brokerName === 'Flattrade') {
      const FLATTRADE_API_TOKEN = localStorage.getItem('FLATTRADE_API_TOKEN');
      const payload = qs.stringify(orderData);
      response = await axios.post('http://localhost:3000/flattradePlaceOrder', payload, {
        headers: {
          'Authorization': `Bearer ${FLATTRADE_API_TOKEN}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    }
    else if (selectedBroker.value?.brokerName === 'Shoonya') {
      const SHOONYA_API_TOKEN = localStorage.getItem('SHOONYA_API_TOKEN');
      const payload = qs.stringify(orderData);
      response = await axios.post('http://localhost:3000/shoonyaPlaceOrder', payload, {
        headers: {
          'Authorization': `Bearer ${SHOONYA_API_TOKEN}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    }

    // console.log(`Order placed successfully for ${getSymbol(position)}`, response.data);
    showToastMessage(`Order placed successfully for ${getSymbol(position)}`);

    // Remove stoploss and target for this position
    const tsym = getSymbol(position);
    delete positionStoplossesPrice.value[tsym];
    delete positionTargetsPrice.value[tsym];

    // Add a delay before fetching updated data
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update both orders and positions
    await updateOrdersAndPositions();

    // Update fund limits
    await updateFundLimits()

  } catch (error) {
    console.error('Failed to place order for position:', error);
    showToastMessage('Failed to place order for SL/Target');
  }
};
const modifyOpenOrder = async (orderId) => {
  try {
    const modifiedData = modifiedOrderData[orderId];
    if (!modifiedData) {
      throw new Error("No modified data found for this order");
    }

    let options;

    if (selectedBroker.value?.brokerName === 'Dhan') {
      const dhanDetails = JSON.parse(localStorage.getItem('broker_Dhan') || '{}');
      
      options = {
        method: 'PUT',
        url: `http://localhost:3000/dhanModifyOrder/${orderId}`,
        headers: {
          'access-token': dhanDetails.apiToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: {
          dhanClientId: selectedBroker.value.clientId,
          orderId: orderId,
          orderType: modifiedData.modifiedOrderType,
          quantity: parseInt(modifiedData.modifiedQuantity),
          price: parseFloat(modifiedData.modifiedPrice),
          triggerPrice: parseFloat(modifiedData.modifiedTriggerPrice || 0),
          validity: "DAY"
        }
      };
    } else if (selectedBroker.value?.brokerName === 'Flattrade' || selectedBroker.value?.brokerName === 'Shoonya') {
      const jKey = localStorage.getItem(`${selectedBroker.value.brokerName.toUpperCase()}_API_TOKEN`);
      options = {
        method: 'POST',
        url: `http://localhost:3000/${selectedBroker.value?.brokerName === 'Flattrade' ? 'flattradeModifyOrder' : 'shoonyaModifyOrder'}`,
        data: {
          norenordno: orderId,
          uid: selectedBroker.value.clientId,
          exch: modifiedData.exch,
          tsym: modifiedData.tsym,
          qty: modifiedData.modifiedQuantity.toString(),
          prc: modifiedData.modifiedPrice.toString(),
          prctyp: modifiedData.modifiedOrderType,
          ret: "DAY"
        },
        params: {
          [`${selectedBroker.value.brokerName.toUpperCase()}_API_TOKEN`]: jKey
        }
      };

      // Only include trigger price for stop loss orders
      if (modifiedData.modifiedOrderType === 'SL-LMT' || modifiedData.modifiedOrderType === 'SL-MKT') {
        options.data.trgprc = (modifiedData.modifiedTriggerPrice || '').toString();
      }

      // If it's a market order, set price to 0
      if (modifiedData.modifiedOrderType === 'MKT') {
        options.data.prc = '';
      }
    } else {
      throw new Error("Unsupported broker");
    }

    // console.log(`Sending request to modify ${selectedBroker.value?.brokerName} order ${orderId}:`, options);
    const response = await axios(options);
    console.log(`${selectedBroker.value?.brokerName} modify order response:`, response.data);

    // Refresh the order book after modifying an order
    if (selectedBroker.value?.brokerName === 'Dhan') {
      await fetchDhanOrdersTradesBook();
    } else if (selectedBroker.value?.brokerName === 'Flattrade') {
      await fetchFlattradeOrdersTradesBook();
    } else if (selectedBroker.value?.brokerName === 'Shoonya') {
      await fetchShoonyaOrdersTradesBook();
    }

    await updateFundLimits();
    delete modifiedOrderData[orderId];
    modifyingOrders[orderId] = false;

    showToastMessage('Order modified successfully');
  } catch (error) {
    console.error(`Failed to modify ${selectedBroker.value?.brokerName} order ${orderId}:`, error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    showToastMessage(`Failed to modify order: ${error.message}`);
  }
};
// Close all positions for Dhan, Flattrade, or Shoonya
const closeAllPositions = async () => {
  try {
    let positionsClosed = false;

    if (selectedBroker.value?.brokerName === 'Dhan') {
      for (const position of dhanPositionBook.value) {
        const netQty = Number(position.netQty);
        if (netQty !== 0) {
          const transactionType = netQty > 0 ? 'SELL' : 'BUY';
          const optionType = position.tradingSymbol.includes('CE') ? 'CALL' : 'PUT';
          await placeOrderForPosition(transactionType, optionType, position);
          positionsClosed = true;
        }
      }
    } else if (selectedBroker.value?.brokerName === 'Flattrade') {
      for (const position of flatTradePositionBook.value) {
        const netqty = Number(position.netqty);
        if (netqty !== 0) {
          const transactionType = netqty > 0 ? 'S' : 'B';
          const optionType = position.tsym.includes('C') ? 'CALL' : 'PUT';
          await placeOrderForPosition(transactionType, optionType, position);
          positionsClosed = true;
        }
      }
    } else if (selectedBroker.value?.brokerName === 'Shoonya') {
      for (const position of shoonyaPositionBook.value) {
        const netqty = Number(position.netqty);
        if (netqty !== 0) {
          const transactionType = netqty > 0 ? 'S' : 'B';
          const optionType = position.tsym.includes('C') ? 'CALL' : 'PUT';
          await placeOrderForPosition(transactionType, optionType, position);
          positionsClosed = true;
        }
      }
    }

    // Add a delay before fetching updated data
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update both orders and positions
    await updateOrdersAndPositions();

    // Update fund limits
    await updateFundLimits()

    if (positionsClosed) {
      showToastMessage(`All ${selectedBroker.value?.brokerName} positions closed successfully`);
    } else {
      showToastMessage(`No positions to close for ${selectedBroker.value?.brokerName}`);
    }
  } catch (error) {
    console.error('Error closing positions:', error);
    showToastMessage('Failed to close all positions');
  }
};

// Add this to your reactive variables
const selectedShoonyaPositionsSet = ref(new Set());
const selectedFlattradePositionsSet = ref(new Set());

// Function to close selected positions based on the selected broker
const closeSelectedPositions = async () => {
  try {
    let positionsClosed = false;

    if (selectedBroker.value?.brokerName === 'Shoonya') {
      // Create a copy of the selected positions to iterate over
      const positionsToClose = [...selectedShoonyaPositionsSet.value];

      for (const tsym of positionsToClose) {
        const position = shoonyaPositionBook.value.find(p => p.tsym === tsym);
        const netqty = Number(position.netqty);
        if (netqty !== 0) {
          const transactionType = netqty > 0 ? 'S' : 'B';
          const optionType = position.tsym.includes('C') ? 'CALL' : 'PUT';
          await placeOrderForPosition(transactionType, optionType, position);
          positionsClosed = true;

          // Remove the closed position from the selected positions
          selectedShoonyaPositionsSet.value.delete(tsym);
        }
      }
    } else if (selectedBroker.value?.brokerName === 'Flattrade') {
      // Create a copy of the selected positions to iterate over
      const positionsToClose = [...selectedFlattradePositionsSet.value];

      for (const tsym of positionsToClose) {
        const position = flatTradePositionBook.value.find(p => p.tsym === tsym);
        const netqty = Number(position.netqty);
        if (netqty !== 0) {
          const transactionType = netqty > 0 ? 'S' : 'B';
          const optionType = position.tsym.includes('C') ? 'CALL' : 'PUT';
          await placeOrderForPosition(transactionType, optionType, position);
          positionsClosed = true;

          // Remove the closed position from the selected positions
          selectedFlattradePositionsSet.value.delete(tsym);
        }
      }
    }

    // Add a delay before fetching updated data
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update both orders and positions
    await updateOrdersAndPositions();

    // Update fund limits
    await updateFundLimits();

    if (positionsClosed) {
      showToastMessage(`Selected positions closed successfully`);
    } else {
      showToastMessage(`No positions to close`);
    }
  } catch (error) {
    console.error('Error closing selected positions:', error);
    showToastMessage('Failed to close selected positions');
  }
};
const cancelOrder = async (order) => {
  const orderId = selectedBroker.value?.brokerName === 'Dhan' ? order.orderId : order.norenordno;
  const orderStatus = selectedBroker.value?.brokerName === 'Dhan' ? order.orderStatus : order.status;

  // console.log(`Attempting to cancel order ${orderId} with status ${orderStatus}`);
  // console.log(`Broker: ${selectedBroker.value?.brokerName}`);

  if ((selectedBroker.value?.brokerName === 'Dhan' && orderStatus !== 'PENDING') ||
    (selectedBroker.value?.brokerName === 'Flattrade' && orderStatus !== 'OPEN')) {
    // console.log(`Order ${orderId} is not in a cancellable state and cannot be canceled.`);
    return;
  }

  try {
    if (selectedBroker.value?.brokerName === 'Dhan') {
      const dhanDetails = JSON.parse(localStorage.getItem('broker_Dhan') || '{}');
      // console.log(`Sending request to cancel Dhan order ${orderId}`);
      await axios.delete('http://localhost:3000/dhanCancelOrder', {
        data: { orderId },
        params: {
          DHAN_API_TOKEN: dhanDetails.apiToken
        }
      });
    }
    else if (selectedBroker.value?.brokerName === 'Flattrade') {
      const jKey = localStorage.getItem('FLATTRADE_API_TOKEN') || token.value;
      const clientId = selectedBroker.value.clientId;
      // console.log(`Sending request to cancel Flattrade order ${orderId}`);
      await axios.post('http://localhost:3000/flattradeCancelOrder', {
        norenordno: orderId,
        uid: clientId
      }, {
        params: {
          FLATTRADE_API_TOKEN: jKey
        }
      });
    }
    else if (selectedBroker.value?.brokerName === 'Shoonya') {
      const jKey = localStorage.getItem('SHOONYA_API_TOKEN') || token.value;
      const clientId = selectedBroker.value.clientId;
      console.log(`Sending request to cancel Shoonya order ${orderId}`);
      await axios.post('http://localhost:3000/shoonyaCancelOrder', {
        norenordno: orderId,
        uid: clientId
      }, {
        params: {
          SHOONYA_API_TOKEN: jKey
        }
      });
    }
    // console.log(`Order ${orderId} canceled successfully.`);
    // Update fund limits
    await updateFundLimits();
  } catch (error) {
    console.error(`Failed to cancel order ${orderId}:`, error);
    showToastMessage('Failed to cancel order');
    throw error; // Rethrow to handle in cancelPendingOrders
  }
};

const cancelPendingOrders = async () => {
  // console.log(`Canceling pending orders for broker: ${selectedBroker.value?.brokerName}`);

  // Fetch orders based on the selected broker
  if (selectedBroker.value?.brokerName === 'Dhan') {
    await fetchDhanOrdersTradesBook();
  } else if (selectedBroker.value?.brokerName === 'Flattrade') {
    await fetchFlattradeOrdersTradesBook();
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    await fetchShoonyaOrdersTradesBook();
  }

  let pendingOrders;
  if (selectedBroker.value?.brokerName === 'Dhan') {
    pendingOrders = dhanOrders.value.filter(order => order.orderStatus === 'PENDING');
  } else if (selectedBroker.value?.brokerName === 'Flattrade') {
    pendingOrders = flatOrderBook.value.filter(order => order.status === 'OPEN');
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    pendingOrders = shoonyaOrderBook.value.filter(order => order.status === 'OPEN');
  } else {
    console.error('Unknown broker');
    return;
  }

  // console.log(`Pending orders:`, pendingOrders);

  const cancelPromises = pendingOrders.map(order => cancelOrder(order));

  try {
    await Promise.all(cancelPromises);
    showToastMessage('Pending orders canceled successfully');

    // Refresh the orders list based on the selected broker
    if (selectedBroker.value?.brokerName === 'Dhan') {
      await fetchDhanOrdersTradesBook();
    } else if (selectedBroker.value?.brokerName === 'Flattrade') {
      await fetchFlattradeOrdersTradesBook();
    } else if (selectedBroker.value?.brokerName === 'Shoonya') {
      await fetchShoonyaOrdersTradesBook();
    }
  } catch (error) {
    console.error('Failed to cancel orders:', error);
    showToastMessage('Failed to cancel some orders');
  }
};
const formatPrice = (price) => {
  if (price == null || isNaN(price)) {
    return '-';
  }
  const numPrice = Number(price);
  return numPrice.toFixed(2);
};
const getSymbol = (position) => {
  return position.tsym || position.tradingSymbol || '';
};

// Cancel Open Order from Trades Tab...  
const cancelOpenOrder = async (orderId) => {
  // console.log(`Canceling open order with ID: ${orderId}`);
  try {
    if (selectedBroker.value?.brokerName === 'Dhan') {
      const dhanDetails = JSON.parse(localStorage.getItem('broker_Dhan') || '{}');
      // console.log(`Sending request to cancel Dhan order ${orderId}`);
      await axios.delete('http://localhost:3000/dhanCancelOrder', {
        data: { orderId },
        params: {
          DHAN_API_TOKEN: dhanDetails.apiToken
        }
      });
      await fetchDhanOrdersTradesBook();
    }
    else if (selectedBroker.value?.brokerName === 'Flattrade') {
      const jKey = localStorage.getItem('FLATTRADE_API_TOKEN') || token.value;
      const clientId = selectedBroker.value.clientId;
      // console.log(`Sending request to cancel Flattrade order ${orderId}`);
      await axios.post('http://localhost:3000/flattradeCancelOrder', {
        norenordno: orderId,
        uid: clientId
      }, {
        params: {
          FLATTRADE_API_TOKEN: jKey
        }
      });
      await fetchFlattradeOrdersTradesBook();
    }
    else if (selectedBroker.value?.brokerName === 'Shoonya') {
      const jKey = localStorage.getItem('SHOONYA_API_TOKEN') || token.value;
      const clientId = selectedBroker.value.clientId;
      // console.log(`Sending request to cancel Shoonya order ${orderId}`);
      await axios.post('http://localhost:3000/shoonyaCancelOrder', {
        norenordno: orderId,
        uid: clientId
      }, {
        params: {
          SHOONYA_API_TOKEN: jKey
        }
      });
      await fetchShoonyaOrdersTradesBook();
    }
    // console.log(`Order ${orderId} canceled successfully.`);
    await updateFundLimits();
  } catch (error) {
    console.error(`Failed to cancel order ${orderId}:`, error);
    showToastMessage('Failed to cancel order');
    throw error; 
  }
};

// Modify the setStoplossAndTarget function
const setStoplossAndTarget = (position) => {
  const tsym = getSymbol(position);
  if (!tsym) return;

  const netQty = Number(position.netQty || position.netqty);
  const isLong = netQty > 0;
  const currentLTP = Number(positionLTPs.value[tsym] || 0);

  if (tradeSettings.enableStoploss) {
    let stoplossPrice = isLong
      ? currentLTP - tradeSettings.stoplossValue
      : currentLTP + tradeSettings.stoplossValue;

    // Ensure stoploss price is not negative for long positions
    if (isLong && stoplossPrice <= 0) {
      // console.log(`Stoploss for ${tsym} would be negative or zero. Disabling stoploss.`);
      delete positionStoplossesPrice.value[tsym];
      tradeSettings.enableStoploss = false;
    } else {
      positionStoplossesPrice.value[tsym] = stoplossPrice;
    }
  } else {
    delete positionStoplossesPrice.value[tsym];
  }

  if (tradeSettings.enableTarget) {
    positionTargetsPrice.value[tsym] = isLong
      ? currentLTP + tradeSettings.targetValue
      : currentLTP - tradeSettings.targetValue;
  } else {
    delete positionTargetsPrice.value[tsym];
  }

  // console.log(`Set SL/Target for ${tsym}: LTP=${currentLTP}, SL Price=${positionStoplossesPrice.value[tsym]}, Target Price=${positionTargetsPrice.value[tsym]}`);

  localStorage.setItem('positionStoplossesPrice', JSON.stringify(positionStoplossesPrice.value));
  localStorage.setItem('positionTargetsPrice', JSON.stringify(positionTargetsPrice.value));
  saveTradeSettings();
};
// Add this to your reactive variables
const positionsInExecution = ref({});

// Modify the checkStoplossAndTarget function
const checkStoplossAndTarget = (position, currentLTP) => {
  const tsym = getSymbol(position);
  if (!tsym) {
    console.error('Invalid position object:', position);
    return;
  }
  const netQty = Number(position.netQty || position.netqty);

  if (netQty === 0 || positionsInExecution.value[tsym]) {
    return;
  }

  const stoplossPrice = positionStoplossesPrice.value[tsym];
  const targetPrice = positionTargetsPrice.value[tsym];

  const isLong = netQty > 0;

  // console.log(`Checking ${tsym}: LTP=${currentLTP}, SL Price=${stoplossPrice}, Target Price=${targetPrice}, IsLong=${isLong}`);

  const executeOrder = (orderType, reason) => {
    // console.log(`${reason} for ${isLong ? 'long' : 'short'} position ${tsym}`);
    positionsInExecution.value[tsym] = true;
    placeOrderForPosition(orderType, tsym.includes('CE') || tsym.includes('C') ? 'C' : 'P', position)
      .finally(() => {
        delete positionsInExecution.value[tsym];
      });
  };

  if (isLong) {
    if (tradeSettings.enableStoploss && stoplossPrice && currentLTP <= stoplossPrice) {
      executeOrder('S', 'Stoploss hit');
    } else if (tradeSettings.enableTarget && targetPrice && currentLTP >= targetPrice) {
      executeOrder('S', 'Target hit');
    }
  } else {
    if (tradeSettings.enableStoploss && stoplossPrice && currentLTP >= stoplossPrice) {
      executeOrder('B', 'Stoploss hit');
    } else if (tradeSettings.enableTarget && targetPrice && currentLTP <= targetPrice) {
      executeOrder('B', 'Target hit');
    }
  }
};
const continuouslyCheckPositions = () => {
  [...flatTradePositionBook.value, ...shoonyaPositionBook.value, ...dhanPositionBook.value].forEach(position => {
    const tsym = getSymbol(position);
    const stoplossPrice = positionStoplossesPrice.value[tsym];
    const targetPrice = positionTargetsPrice.value[tsym];

    // Skip if both stoploss and target are undefined or disabled
    if ((!stoplossPrice && !targetPrice) || (!tradeSettings.enableStoploss && !tradeSettings.enableTarget)) {
      return;
    }

    const currentLTP = positionLTPs.value[tsym];
    if (currentLTP) {
      checkStoplossAndTarget(position, currentLTP);
    }
  });
};

const availableBalance = computed(() => {
  // console.log('Fund Limits:', fundLimits.value);
  // console.log('Selected Broker:', selectedBroker.value?.brokerName);

  if (selectedBroker.value?.brokerName === 'Dhan') {
    const dhanBalance = fundLimits.value.availabelBalance;
    // console.log('Dhan Available Balance (raw):', dhanBalance);
    // console.log('Dhan Available Balance (type):', typeof dhanBalance);

    // Convert to number if it's a string, or use the value directly if it's already a number
    const numericBalance = typeof dhanBalance === 'string' ? parseFloat(dhanBalance) : dhanBalance;

    // console.log('Dhan Available Balance (processed):', numericBalance);
    return isNaN(numericBalance) ? null : Math.floor(numericBalance);
  }
  else if (selectedBroker.value?.brokerName === 'Flattrade') {
    const cash = Number(fundLimits.value.cash) || Number(fundLimits.value.payin) || 0;
    const marginUsed = Number(fundLimits.value.marginused) || 0;
    const balance = Math.floor(cash - marginUsed);
    // console.log('Flattrade Available Balance:', balance);
    return balance;
  }
  else if (selectedBroker.value?.brokerName === 'Shoonya') {
    const cash = Number(fundLimits.value.cash) || Number(fundLimits.value.payin) || 0;
    const marginUsed = Number(fundLimits.value.marginused) || 0;
    const balance = Math.floor(cash - marginUsed);
    // console.log('Shoonya Available Balance:', balance);
    return balance;
  }
  return null;
});
// Computed property to get the correct utilized amount based on the selected broker
const usedAmount = computed(() => {
  if (selectedBroker.value?.brokerName === 'Dhan') {
    const utilizedAmount = Number(fundLimits.value.utilizedAmount) || 0;
    return utilizedAmount;
  }
  else if (selectedBroker.value?.brokerName === 'Flattrade') {
    const marginUsed = Number(fundLimits.value.marginused) || 0;
    return marginUsed;
  }
  else if (selectedBroker.value?.brokerName === 'Shoonya') {
    const marginUsed = Number(fundLimits.value.marginused) || 0;
    return marginUsed;
  }
  return 0;
});

const formattedDate = computed(() => {
  const today = new Date();
  const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
  return today.toLocaleDateString('en-US', options).replace(/,/g, '');
});

const totalNetQty = computed(() => {
  const calculateTotalQty = (positions) => {
    return positions.reduce((total, position) => {
      const qty = Math.abs(parseInt(position.netQty || position.netqty, 10));
      return total + qty;
    }, 0);
  };

  if (selectedBroker.value?.brokerName === 'Dhan') {
    return calculateTotalQty(dhanPositionBook.value);
  } else if (selectedBroker.value?.brokerName === 'Flattrade') {
    return calculateTotalQty(flatTradePositionBook.value);
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    return calculateTotalQty(shoonyaPositionBook.value);
  }
  return 0;
});

const totalProfit = computed(() => {
  if (selectedBroker.value?.brokerName === 'Dhan') {
    return positionsWithCalculatedProfit.value.reduce((acc, position) => {
      const unrealizedProfit = position.calculatedUrmtom;
      const realizedProfit = position.realizedProfit || 0;
      return acc + unrealizedProfit + realizedProfit;
    }, 0);
  } else if (selectedBroker.value?.brokerName === 'Flattrade' || selectedBroker.value?.brokerName === 'Shoonya') {
    return positionsWithCalculatedProfit.value.reduce((acc, position) => {
      const unrealizedProfit = position.calculatedUrmtom;
      const realizedProfit = parseFloat(position.rpnl) || 0;
      return acc + unrealizedProfit + realizedProfit;
    }, 0);
  }
  return 0;
});

const calculateUnrealizedProfit = (position) => {
  const ltp = positionLTPs.value[position.tsym || position.tradingSymbol] || position.lp || position.lastPrice;
  const netQty = parseFloat(position.netqty || position.netQty);
  const netAvgPrice = parseFloat(position.netavgprc || position.averagePrice);
  const priceFactor = parseFloat(position.prcftr || position.multiplier || 1);

  if (ltp && !isNaN(netQty) && !isNaN(netAvgPrice)) {
    return netQty * (ltp - netAvgPrice) * priceFactor;
  }
  return 0;
};

const positionsWithCalculatedProfit = computed(() => {
  if (selectedBroker.value?.brokerName === 'Dhan') {
    return dhanPositionBook.value.map(position => ({
      ...position,
      calculatedUrmtom: calculateUnrealizedProfit(position)
    }));
  } else if (selectedBroker.value?.brokerName === 'Flattrade') {
    return flatTradePositionBook.value.map(position => ({
      ...position,
      calculatedUrmtom: calculateUnrealizedProfit(position)
    }));
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    return shoonyaPositionBook.value.map(position => ({
      ...position,
      calculatedUrmtom: calculateUnrealizedProfit(position)
    }));
  }
  return [];
});

// const profitData = computed(() => {
//   if (selectedBroker.value?.brokerName === 'Dhan') {
//     return dhanPositionBook.value.map(position => position.unrealizedProfit + position.realizedProfit);
//   } else if (selectedBroker.value?.brokerName === 'Flattrade') {
//     return flatTradePositionBook.value.map(position => parseFloat(position.urmtom) + parseFloat(position.rpnl));
//   }
//   return [];
// });

const totalCapitalPercentage = computed(() => {
  const totalMoney = Number(availableBalance.value) + Number(usedAmount.value);
  return totalMoney ? (Number(totalProfit.value) / totalMoney) * 100 : 0;
});
const deployedCapitalPercentage = computed(() => {
  const totalUsedAmount = usedAmount.value || 0;
  return totalUsedAmount ? (totalProfit.value / totalUsedAmount) * 100 : 0;
});

const totalBrokerage = computed(() => {
  let total = 0;

  // Calculate totalValue based on totalBuyValue and totalSellValue
  const totalValue = totalBuyValue.value + totalSellValue.value;

  if (selectedBroker.value?.brokerName === 'Dhan') {
    // Calculate charges for Dhan broker
    const exchangeCharge = Math.round(totalValue * 0.0005 * 100) / 100;
    const sebiCharge = Math.round(totalValue * 0.000001 * 100) / 100;
    const gstCharge = Math.round((exchangeCharge + sebiCharge) * 18) / 100;
    const stampdutyCharge = Math.round(totalBuyValue.value * 0.0003);
    const sttCharge = Math.round(totalSellValue.value * 0.000625 * 100) / 100;

    // Accumulate brokerage for Dhan
    for (const order of dhanOrders.value) {
      if (order.orderStatus === 'TRADED') {
        total += 23.6; // Accumulate brokerage total
      }
    }

    // Add charges to total for Dhan
    total += (exchangeCharge + sebiCharge + gstCharge + stampdutyCharge + sttCharge);

  } else if (selectedBroker.value?.brokerName === 'Flattrade' || selectedBroker.value?.brokerName === 'Shoonya') {
    // Calculate charges for Flattrade and Shoonya (they have the same structure)
    const exchangeCharge = Math.round(totalValue * 0.000495 * 100) / 100;
    const ipftCharge = Math.round(totalValue * 0.000005 * 100) / 100;
    const sebiCharge = Math.round(totalValue * 0.000001 * 100) / 100;
    const gstCharge = Math.round((exchangeCharge + sebiCharge + ipftCharge) * 18) / 100;
    const stampdutyCharge = Math.round(totalBuyValue.value * 0.00003);
    const sttCharge = Math.round(totalSellValue.value * 0.000625);

    // Add charges to total for Flattrade and Shoonya
    total += (exchangeCharge + ipftCharge + sebiCharge + gstCharge + stampdutyCharge + sttCharge);

    // No additional brokerage for Flattrade and Shoonya
  }

  return total;
});


const netPnl = computed(() => totalProfit.value - totalBrokerage.value);

const setDefaultExpiry = () => {
  if (expiryDates.value.length > 0) {
    selectedExpiry.value = expiryDates.value[0];
  }
};

const clockEmojis = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
const currentClockEmoji = ref(clockEmojis[new Date().getHours() % clockEmojis.length]);

const cycleClockEmoji = () => {
  const currentHour = new Date().getHours();
  let index = currentHour % clockEmojis.length;
  let cycles = 0;

  const interval = setInterval(() => {
    currentClockEmoji.value = clockEmojis[index];
    index = (index + 1) % clockEmojis.length;

    if (index === currentHour % clockEmojis.length) {
      cycles += 1;
    }

    if (cycles === 1 && index === currentHour % clockEmojis.length) { // Complete one full cycle
      clearInterval(interval);
      currentClockEmoji.value = clockEmojis[currentHour % clockEmojis.length]; // Ensure it ends at the current hour
    }
  }, 100); // Adjust the interval time for desired speed
};

const setFlattradeCredentials = async () => {
  try {
    if (!selectedBroker.value || selectedBroker.value?.brokerName !== 'Flattrade') {
      showToastMessage('Realtime LTP data only available for Flattrade');
      return;
    }

    // Check if the broker status is 'Connected'
    if (brokerStatus.value !== 'Connected') {
      console.error('Flattrade broker is not connected');
      showToastMessage('Flattrade broker is not connected');
      return;
    }

    const clientId = selectedBroker.value.clientId;
    const apiToken = localStorage.getItem('FLATTRADE_API_TOKEN');

    if (!clientId || !apiToken) {
      console.error('Flattrade client ID or API token is missing');
      showToastMessage('Flattrade credentials are missing');
      return;
    }

    const symbolInfo = exchangeSymbols.value.symbolData[selectedMasterSymbol.value];
    if (!symbolInfo || !symbolInfo.other) {
      console.error('Invalid or missing symbol info for Flattrade');
      showToastMessage('Invalid symbol selected for Flattrade');
      return;
    }

    const { exchangeCode: flattradeExchangeSegment, exchangeSecurityId: flattradeSecurityId } = symbolInfo.other;

    const response = await axios.post('http://localhost:3000/api/set-flattrade-credentials', {
      usersession: apiToken,
      userid: clientId,
      flattradeExchangeSegment,
      flattradeSecurityId,
      defaultCallSecurityId: defaultCallSecurityId.value,
      defaultPutSecurityId: defaultPutSecurityId.value
    });
    // console.log('Credentials and security IDs set successfully:', response.data);
    showToastMessage('Flattrade credentials set successfully');
  } catch (error) {
    console.error('Error setting credentials and security IDs:', error);
    showToastMessage('Failed to set Flattrade credentials');
  }
};

const setShoonyaCredentials = async () => {
  try {
    if (!selectedBroker.value || selectedBroker.value?.brokerName !== 'Shoonya') {
      showToastMessage('Realtime LTP data only available for Shoonya');
      return;
    }

    // Check if the broker status is 'Connected'
    if (brokerStatus.value !== 'Connected') {
      console.error('Shoonya broker is not connected');
      showToastMessage('Shoonya broker is not connected');
      return;
    }

    const clientId = selectedBroker.value.clientId;
    const apiToken = localStorage.getItem('SHOONYA_API_TOKEN');

    if (!clientId || !apiToken) {
      console.error('Shoonya client ID or API token is missing');
      showToastMessage('Shoonya credentials are missing');
      return;
    }

    const symbolInfo = exchangeSymbols.value.symbolData[selectedMasterSymbol.value];
    if (!symbolInfo || !symbolInfo.other) {
      console.error('Invalid or missing symbol info for Shoonya');
      showToastMessage('Invalid symbol selected for Shoonya');
      return;
    }

    const { exchangeCode: shoonyaExchangeSegment, exchangeSecurityId: shoonyaSecurityId } = symbolInfo.other;

    const response = await axios.post('http://localhost:3000/api/set-shoonya-credentials', {
      usersession: apiToken,
      userid: clientId,
      shoonyaExchangeSegment,
      shoonyaSecurityId,
      defaultCallSecurityId: defaultCallSecurityId.value,
      defaultPutSecurityId: defaultPutSecurityId.value
    });
    // console.log('Credentials and security IDs set successfully:', response.data);
    showToastMessage('Shoonya credentials set successfully');
  } catch (error) {
    console.error('Error setting credentials and security IDs:', error);
    showToastMessage('Failed to set Shoonya credentials');
  }
};

// Update the setDhanCredentials function
const setDhanCredentials = async () => {
  try {
    if (!selectedBroker.value || selectedBroker.value?.brokerName !== 'Dhan') {
      showToastMessage('Realtime LTP data only available for Dhan');
      return;
    }

    // Check if the broker status is 'Connected'
    if (brokerStatus.value !== 'Connected') {
      console.error('Dhan broker is not connected');
      showToastMessage('Dhan broker is not connected');
      return;
    }

    const clientId = selectedBroker.value.clientId;
    const apiToken = localStorage.getItem('DHAN_API_TOKEN');

    if (!clientId || !apiToken) {
      console.error('Dhan client ID or API token is missing');
      showToastMessage('Dhan credentials are missing');
      return;
    }

    const symbolInfo = exchangeSymbols.value.symbolData[selectedMasterSymbol.value];
    if (!symbolInfo || !symbolInfo.dhan) {
      console.error('Invalid or missing symbol info for Dhan');
      showToastMessage('Invalid symbol selected for Dhan');
      return;
    }

    const { exchangeCode: dhanExchangeSegment, exchangeSecurityId: dhanSecurityId } = symbolInfo.dhan;

    const response = await axios.post('http://localhost:3000/api/set-dhan-credentials', {
      accessToken: apiToken,
      clientId: clientId,
      dhanExchangeSegment,
      dhanSecurityId
    });

    // console.log('Credentials and security IDs set successfully:', response.data);
    showToastMessage('Dhan credentials set successfully');
  } catch (error) {
    console.error('Error setting credentials and security IDs:', error);
    showToastMessage('Failed to set Dhan credentials');
  }
};

const isMarketProtectionDisabled = computed(() => {
  if (selectedBroker.value?.brokerName === 'Dhan') {
    return ['MARKET', 'LIMIT', 'STOP_LOSS'].includes(selectedOrderType.value);
  } else if (['Flattrade', 'Shoonya'].includes(selectedBroker.value?.brokerName)) {
    return ['MKT', 'LMT', 'SL-LMT'].includes(selectedOrderType.value);
  }
  return false;
});
watch(selectedOrderType, (newOrderType) => {
  if (isMarketProtectionDisabled.value || !isMarketAsLimitOrder.value) {
    marketProtectionPercentage.value = 0;
  }
});

const socket = ref(null);
const latestCallLTP = ref('N/A');
const latestPutLTP = ref('N/A');

const defaultCallSecurityId = ref(null);
const defaultPutSecurityId = ref(null);

const connectWebSocket = () => {
  let websocketUrl;

  if (selectedBroker.value?.brokerName === 'Flattrade') {
    websocketUrl = 'ws://localhost:8765';
  } else if (selectedBroker.value?.brokerName === 'Shoonya') {
    websocketUrl = 'ws://localhost:8766';
  } else if (selectedBroker.value?.brokerName === 'Dhan') {
    websocketUrl = 'ws://localhost:8767';
  }

  console.log(`Connecting to WebSocket at ${websocketUrl}`);
  socket.value = new WebSocket(websocketUrl);

  // Modify the existing socket.onmessage handler
  socket.value.onmessage = (event) => {
    const quoteData = JSON.parse(event.data);
    // console.log('WebSocket message received:', quoteData);
    if (quoteData.lp) {
      const symbolInfo = exchangeSymbols.value.symbolData[selectedMasterSymbol.value];
      if (symbolInfo) {
        const brokerType = selectedBroker.value?.brokerName === 'Dhan' ? 'dhan' : 'other';
        const { exchangeSecurityId } = symbolInfo[brokerType];

        if (quoteData.tk === exchangeSecurityId) {
          // Update the price for the selected master symbol
          switch (selectedMasterSymbol.value) {
            case 'NIFTY': niftyPrice.value = quoteData.lp; niftyPriceChange.value = quoteData.pc; break;
            case 'BANKNIFTY': bankNiftyPrice.value = quoteData.lp; bankNiftyPriceChange.value = quoteData.pc; break;
            case 'FINNIFTY': finniftyPrice.value = quoteData.lp; finniftyPriceChange.value = quoteData.pc; break;
            case 'NIFTYNXT50': niftynxt50Price.value = quoteData.lp; niftynxt50PriceChange.value = quoteData.pc; break;
            case 'MIDCPNIFTY': midcpniftyPrice.value = quoteData.lp; midcpniftyPriceChange.value = quoteData.pc; break;
            case 'SENSEX': sensexPrice.value = quoteData.lp; sensexPriceChange.value = quoteData.pc; break;
            case 'BANKEX': bankexPrice.value = quoteData.lp; bankexPriceChange.value = quoteData.pc; break;
            case 'SENSEX50': sensex50Price.value = quoteData.lp; sensex50PriceChange.value = quoteData.pc; break;
          }
        }
      }

      if (quoteData.tk === defaultCallSecurityId.value) {
        latestCallLTP.value = quoteData.lp;
        // console.log('Updated Call LTP:', latestCallLTP.value);
      } else if (quoteData.tk === defaultPutSecurityId.value) {
        latestPutLTP.value = quoteData.lp;
        // console.log('Updated Put LTP:', latestPutLTP.value);
      }

      // Update position LTPs
      const positionTsym = Object.keys(positionSecurityIds.value).find(tsym => positionSecurityIds.value[tsym] === quoteData.tk);
      if (positionTsym) {
        positionLTPs.value[positionTsym] = quoteData.lp;
      }
    }
  };

  socket.value.onerror = (error) => {
    console.error('WebSocket Error:', error);
  };

  socket.value.onopen = () => {
    console.log('WebSocket connected');
    initializeSubscriptions();
  };

  socket.value.onclose = () => {
    console.log('WebSocket disconnected. Attempting to reconnect...');
    setTimeout(connectWebSocket, 30000);
  };
};
const currentSubscriptions = ref({
  masterSymbol: null,
  callOption: null,
  putOption: null
});

// Add these new reactive variables
const positionLTPs = ref({});
const positionSecurityIds = ref({});

const subscribeToMasterSymbol = () => {
  if (socket.value && socket.value.readyState === WebSocket.OPEN) {
    const symbolInfo = exchangeSymbols.value.symbolData[selectedMasterSymbol.value];
    if (symbolInfo) {
      const brokerType = selectedBroker.value?.brokerName === 'Dhan' ? 'dhan' : 'other';
      const { exchangeCode, exchangeSecurityId } = symbolInfo[brokerType];
      const symbolToSubscribe = `${exchangeCode}|${exchangeSecurityId}`;
      if (symbolToSubscribe !== `${currentSubscriptions.value.masterSymbolExchangeCode}|${currentSubscriptions.value.masterSymbolSecurityId}`) {
        const data = {
          action: 'subscribe',
          symbols: [symbolToSubscribe]
        };
        // console.log('Sending master symbol subscribe data:', data);
        socket.value.send(JSON.stringify(data));
        currentSubscriptions.value.masterSymbol = selectedMasterSymbol.value;
        currentSubscriptions.value.masterSymbolExchangeCode = exchangeCode;
        currentSubscriptions.value.masterSymbolSecurityId = exchangeSecurityId;
      }
    }
  }
};

const subscribeToOptions = () => {
  if (socket.value && socket.value.readyState === WebSocket.OPEN) {
    const symbolsToSubscribe = [];
    const exchangeSegment = getExchangeSegment().segment;

    // Add subscriptions for Call and Put options
    if (defaultCallSecurityId.value && defaultCallSecurityId.value !== 'N/A' && defaultCallSecurityId.value !== currentSubscriptions.value.callOption) {
      symbolsToSubscribe.push(`${exchangeSegment}|${defaultCallSecurityId.value}`);
    }
    if (defaultPutSecurityId.value && defaultPutSecurityId.value !== 'N/A' && defaultPutSecurityId.value !== currentSubscriptions.value.putOption) {
      symbolsToSubscribe.push(`${exchangeSegment}|${defaultPutSecurityId.value}`);
    }

    if (symbolsToSubscribe.length > 0) {
      const data = {
        action: 'subscribe',
        symbols: symbolsToSubscribe
      };
      // console.log('Sending options subscribe data:', data);
      socket.value.send(JSON.stringify(data));
      currentSubscriptions.value.callOption = defaultCallSecurityId.value;
      currentSubscriptions.value.putOption = defaultPutSecurityId.value;
    }
  }

  // Subscribe to position LTPs separately
  subscribeToPositionLTPs();
};
// Add a new function to update position security IDs
const updatePositionSecurityIds = () => {
  flatTradePositionBook.value.forEach(position => {
    if (position.tsym && !positionSecurityIds.value[position.tsym]) {
      positionSecurityIds.value[position.tsym] = position.token;
    }
  });
  // Add this block for Shoonya positions
  shoonyaPositionBook.value.forEach(position => {
    if (position.tsym && !positionSecurityIds.value[position.tsym]) {
      positionSecurityIds.value[position.tsym] = position.token;
    }
  });
};
const subscribeToPositionLTPs = () => {
  if (socket.value && socket.value.readyState === WebSocket.OPEN) {
    const symbolsToSubscribe = Object.entries(positionSecurityIds.value)
      .map(([tsym, token]) => {
        const position = [
          ...flatTradePositionBook.value,
          ...shoonyaPositionBook.value,
          ...dhanPositionBook.value
        ].find(p => (p.tsym || p.tradingSymbol) === tsym);

        if (!position) {
          console.warn(`No position found for tsym: ${tsym}`);
          return null;
        }

        const exchange = position.exch || position.exchangeSegment || 'NFO' || NSE_NFO;
        return `${exchange}|${token}`;
      })
      .filter(Boolean);

    if (symbolsToSubscribe.length > 0) {
      const data = {
        action: 'subscribe',
        symbols: symbolsToSubscribe
      };
      // console.log('Sending position LTPs subscribe data:', data);
      socket.value.send(JSON.stringify(data));
    }
  }
};


// Add a watcher for flatTradePositionBook
watch(flatTradePositionBook, () => {
  updatePositionSecurityIds();
  subscribeToOptions();
}, { deep: true });
// Add this watcher after the existing watcher for flatTradePositionBook
watch(shoonyaPositionBook, () => {
  updatePositionSecurityIds();
  subscribeToOptions();
}, { deep: true });

const unsubscribeFromSymbols = (symbols) => {
  if (socket.value && socket.value.readyState === WebSocket.OPEN && symbols.length > 0) {
    const data = {
      action: 'unsubscribe',
      symbols: symbols
    };
    // console.log('Sending unsubscribe data:', data);
    socket.value.send(JSON.stringify(data));
  }
};

const updateSubscriptions = () => {
  const symbolsToUnsubscribe = [];

  // Check if master symbol has changed
  if (currentSubscriptions.value.masterSymbol !== selectedMasterSymbol.value) {
    if (currentSubscriptions.value.masterSymbol) {
      const oldSymbolInfo = exchangeSymbols.value.symbolData[currentSubscriptions.value.masterSymbol];
      if (oldSymbolInfo) {
        symbolsToUnsubscribe.push(`${oldSymbolInfo.exchangeCode}|${oldSymbolInfo.exchangeSecurityId}`);
      }
    }
  }

  // Check if options have changed
  if (currentSubscriptions.value.callOption && currentSubscriptions.value.callOption !== defaultCallSecurityId.value) {
    symbolsToUnsubscribe.push(`NFO|${currentSubscriptions.value.callOption}`);
  }
  if (currentSubscriptions.value.putOption && currentSubscriptions.value.putOption !== defaultPutSecurityId.value) {
    symbolsToUnsubscribe.push(`NFO|${currentSubscriptions.value.putOption}`);
  }

  // Unsubscribe from old symbols
  if (symbolsToUnsubscribe.length > 0) {
    unsubscribeFromSymbols(symbolsToUnsubscribe);
  }

  // Subscribe to new symbols
  subscribeToMasterSymbol();
  subscribeToOptions();
  subscribeToPositionLTPs();
};
const initializeSubscriptions = () => {
  subscribeToMasterSymbol();
  subscribeToOptions();
};
const debouncedUpdateSubscriptions = debounce(updateSubscriptions, 300);

const totalBuyValue = computed(() => {
  if (selectedBroker.value?.brokerName === 'Flattrade') {
    return flatTradePositionBook.value.reduce((total, position) => total + parseFloat(position.daybuyamt || 0), 0);
  }
  if (selectedBroker.value?.brokerName === 'Shoonya') {
    return shoonyaPositionBook.value.reduce((total, position) => total + parseFloat(position.daybuyamt || 0), 0);
  }
  if (selectedBroker.value?.brokerName === 'Dhan') {
    return dhanPositionBook.value.reduce((total, position) => total + position.dayBuyValue, 0);
  }
  return 0;
});

const totalSellValue = computed(() => {
  if (selectedBroker.value?.brokerName === 'Flattrade') {
    return flatTradePositionBook.value.reduce((total, position) => total + parseFloat(position.daysellamt || 0), 0);
  }
  if (selectedBroker.value?.brokerName === 'Shoonya') {
    return shoonyaPositionBook.value.reduce((total, position) => total + parseFloat(position.daysellamt || 0), 0);
  }
  if (selectedBroker.value?.brokerName === 'Dhan') {
    return dhanPositionBook.value.reduce((total, position) => total + position.daySellValue, 0);
  }
  return 0;
});

let timer;
let positionCheckInterval;

// Lifecycle hooks
onMounted(async () => {
  try {
    await checkAllTokens();
    initKillSwitch();
    const storedBroker = localStorage.getItem('selectedBroker');
    if (storedBroker) {
      const brokerDetails = JSON.parse(storedBroker);
      selectedBroker.value = brokerDetails;
      selectedBrokerName.value = brokerDetails.brokerName;
    }
    await updateExchangeSymbols();
    setDefaultExchangeAndMasterSymbol();
    await fetchTradingData();
    updateAvailableQuantities();
    loadLots();
    updateSelectedQuantity();
    setDefaultExpiry();
    showToastMessage('Welcome to the Steadfast!');

    window.addEventListener('keydown', handleHotKeys);

    // Initialize with the default active tab
    if (activeTab.value === 'positions') {
      await fetchPositions();
    } else if (activeTab.value === 'trades') {
      await fetchTrades();
    }
    enableHotKeys.value = localStorage.getItem('EnableHotKeys') !== 'false';

    timer = setInterval(() => {
      currentTime.value = Date.now();
    }, 1000);

    connectWebSocket();

    // Load stoploss and target values from localStorage
    positionStoplosses.value = JSON.parse(localStorage.getItem('positionStoplosses') || '{}');
    positionTargets.value = JSON.parse(localStorage.getItem('positionTargets') || '{}');
    positionStoplossesPrice.value = JSON.parse(localStorage.getItem('positionStoplossesPrice') || '{}');
    positionTargetsPrice.value = JSON.parse(localStorage.getItem('positionTargetsPrice') || '{}');
    // Start continuous position checking
    positionCheckInterval = setInterval(continuouslyCheckPositions, 1000); // Check every second
  } catch (error) {
    console.error('Error during onMounted:', error);
    showToastMessage('An error occurred while loading the Trade View.');
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleHotKeys);
  if (socket.value) {
    socket.value.close();
  }
  clearInterval(timer);
  if (positionCheckInterval) {
    clearInterval(positionCheckInterval);
  }
});

// Watchers
// Watch for changes in selectedBrokerName
watch(selectedBrokerName, () => {
  updateSelectedBroker();
});
watch(selectedBroker, async (newBroker) => {
  if (newBroker) {
    selectedOrderType.value = orderTypes.value[0];
    previousOrderType.value = orderTypes.value[0];
    selectedProductType.value = getProductTypeValue(productTypes.value[1]); // Default to 'Margin' or 'M'
    await fetchFundLimit();
    await updateExchangeSymbols();
    setDefaultExchangeAndMasterSymbol();
    await fetchTradingData();
    setDefaultExpiry();

    // Update the table based on the active tab
    if (activeTab.value === 'positions') {
      await fetchPositions();
    } else if (activeTab.value === 'trades') {
      await fetchTrades();
    }
  }
});

// Watcher for selectedExpiry to repopulate strike prices
watch(selectedExpiry, async (newExpiry) => {
  await fetchTradingData();
  updateStrikesForExpiry(newExpiry);
});

watch(selectedCallStrike, (newStrike, oldStrike) => {
  // console.log('Selected Call Strike changed:', newStrike);
  if (newStrike !== oldStrike) {
    defaultCallSecurityId.value = newStrike.securityId || 'N/A';
  }
});

watch(selectedPutStrike, (newStrike, oldStrike) => {
  // console.log('Selected Put Strike changed:', newStrike);
  if (newStrike !== oldStrike) {
    defaultPutSecurityId.value = newStrike.securityId || 'N/A';
  }
});

// Watchers for defaultCallSecurityId and defaultPutSecurityId
// This watcher handles unsubscribing and subscribing to new security IDs,
// setting Flattrade credentials, and sending WebSocket data when either ID changes.
// Modify the watcher for defaultCallSecurityId and defaultPutSecurityId
watch(
  [
    () => defaultCallSecurityId.value,
    () => defaultPutSecurityId.value
  ],
  ([newCallId, newPutId], [oldCallId, oldPutId]) => {
    if (newCallId !== oldCallId || newPutId !== oldPutId) {
      debouncedUpdateSubscriptions();

      // Reset LTP values when subscribing to new symbols
      if (newCallId !== oldCallId) {
        latestCallLTP.value = 'N/A';
      }
      if (newPutId !== oldPutId) {
        latestPutLTP.value = 'N/A';
      }

      if (selectedBroker.value?.brokerName === 'Flattrade') {
        setFlattradeCredentials();
      }
      if (selectedBroker.value?.brokerName === 'Shoonya') {
        setShoonyaCredentials();
      }
      if (selectedBroker.value?.brokerName === 'Dhan') {
        setDhanCredentials();
      }
    }
  },
  { deep: true }
);

// Modify the watcher for selectedMasterSymbol
watch(selectedMasterSymbol, async (newValue, oldValue) => {
  // console.log('selectedMasterSymbol changed:', newValue);
  saveUserChoice();
  updateAvailableQuantities();
  updateSelectedQuantity();

  // Fetch new trading data and update expiry
  await fetchTradingData();
  setDefaultExpiry();

  // Force re-synchronization of strikes
  synchronizeCallStrikes();
  synchronizePutStrikes();

  // Update subscriptions
  debouncedUpdateSubscriptions();
});


// Watch productTypes to set the default selectedProductType
watch(productTypes, (newProductTypes) => {
  if (newProductTypes.length > 0) {
    selectedProductType.value = getProductTypeValue(newProductTypes[1]); // Default to 'Margin' or 'M'
  }
}, { immediate: true });

// Add a watcher for selectedExchange
watch(selectedExchange, (newValue) => {
  saveUserChoice(); // Save the user's choice
  if (exchangeSymbols.value[newValue].length > 0) {
    const savedMasterSymbol = localStorage.getItem('selectedMasterSymbol');
    selectedMasterSymbol.value = savedMasterSymbol && exchangeSymbols.value[newValue].includes(savedMasterSymbol)
      ? savedMasterSymbol
      : exchangeSymbols.value[newValue][0];
  } else {
    selectedMasterSymbol.value = null;
  }
  updateAvailableQuantities();
});

watch(selectedOrderType, (newValue, oldValue) => {
  previousOrderType.value = oldValue;
});

const activeFetchFunction = ref(null);

const fetchFunctions = {
  'Flattrade': fetchFlattradePositions,
  'Dhan': fetchDhanPositions,
  'Shoonya': fetchShoonyaPositions
};

const fetchTradesFunctions = {
  'Flattrade': fetchFlattradeOrdersTradesBook,
  'Dhan': fetchDhanOrdersTradesBook,
  'Shoonya': fetchShoonyaOrdersTradesBook
};

const fetchPositions = async () => {
  const brokerName = selectedBroker.value?.brokerName;
  if (brokerName && fetchFunctions[brokerName]) {
    activeFetchFunction.value = fetchFunctions[brokerName].name;
    await fetchFunctions[brokerName]();
  }
};

const fetchTrades = async () => {
  const brokerName = selectedBroker.value?.brokerName;
  if (brokerName && fetchTradesFunctions[brokerName]) {
    activeFetchFunction.value = fetchTradesFunctions[brokerName].name;
    await fetchTradesFunctions[brokerName]();
  }
};

watch(activeTab, async (newTab) => {
  // Update activeFetchFunction based on the new broker
  if (newTab === 'positions') {
    await fetchPositions();
  } else if (newTab === 'trades') {
    await fetchTrades();
  }
});

// Watcher to update localStorage when enableHotKeys changes
watch(enableHotKeys, (newValue) => {
  localStorage.setItem('EnableHotKeys', newValue.toString());
});


// Modify the existing watcher for positionLTPs
watch(positionLTPs, (newLTPs, oldLTPs) => {
  // console.log('positionLTPs updated:', newLTPs);
  Object.entries(newLTPs).forEach(([tsym, ltp]) => {
    if (ltp !== oldLTPs[tsym]) {
      // console.log(`LTP changed for ${tsym}: ${oldLTPs[tsym]} -> ${ltp}`);
      const position = [...flatTradePositionBook.value, ...shoonyaPositionBook.value, ...dhanPositionBook.value]
        .find(p => (p.tsym || p.tradingSymbol) === tsym);
      if (position) {
        // console.log(`Found position for ${tsym}:`, position);
        checkStoplossAndTarget(position, ltp);
      } else {
        // console.log(`No position found for ${tsym}`);
      }
    }
  });
}, { deep: true });

// Add watchers for enableStoploss, stoplossValue, enableTarget, and targetValue
watch(() => [tradeSettings.enableStoploss, tradeSettings.stoplossValue, tradeSettings.enableTarget, tradeSettings.targetValue], () => {
  const allPositions = [...flatTradePositionBook.value, ...shoonyaPositionBook.value, ...dhanPositionBook.value];
  allPositions.forEach(setStoplossAndTarget);
});
// // Modify the existing watchers for position books to set initial stoploss and target
// watch([flatTradePositionBook, shoonyaPositionBook, dhanPositionBook, positionLTPs], () => {
//   const allPositions = [...flatTradePositionBook.value, ...shoonyaPositionBook.value, ...dhanPositionBook.value];
//   allPositions.forEach(setStoplossAndTarget);
// }, { deep: true });
// Modify the existing watcher for tradeSettings
watch(tradeSettings, (newSettings, oldSettings) => {
  // console.log('Trade settings changed:', newSettings, oldSettings);
  saveTradeSettings();
  const allPositions = [...flatTradePositionBook.value, ...shoonyaPositionBook.value, ...dhanPositionBook.value];
  allPositions.forEach(setStoplossAndTarget);
}, { deep: true });
</script>
