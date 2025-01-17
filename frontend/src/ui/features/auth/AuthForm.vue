<script setup lang="ts">
import {useToasts} from "@/composables/useToasts"
import {Errors} from "@/constants/errors"
import {useMachine} from "@xstate/vue"
import {isErrorMessage, wsClient} from "@/modules/ws"
import {authMachine} from "./auth.machine"
import StepLogin from "./fragments/StepLogin.vue"
import StepRegister from "./fragments/StepRegister.vue"
import StepSavePhrase from "./fragments/StepSavePhrase.vue"
import StepStart from "./fragments/StepStart.vue"

import type {AuthStartMsg} from "./types"

const toasts = useToasts()
const {snapshot, send} = useMachine(authMachine)

wsClient.on<AuthStartMsg>("auth.start").subscribe((message) => {
  if (isErrorMessage(message)) {
    toasts.error(Errors[message.error])
    return
  }

  if (message.data.status === "candidate") {
    send({type: "REGISTER", username: message.data.username, qrUrl: message.data.qr_url})
  } else {
    send({type: "LOGIN", username: message.data.username})
  }
})
</script>

<template>
  <div>
    <StepStart v-if="snapshot.matches('start')" @submit="wsClient.send({type: 'auth.start', data: {username: $event}})" />

    <StepLogin v-if="snapshot.matches('login')" :username="snapshot.context.username" @back="send({type: 'BACK_TO_START'})" />

    <StepRegister
      v-if="snapshot.matches('register')"
      :username="snapshot.context.username"
      :qr-code="snapshot.context.qrUrl"
      @submit="send({type: 'SAVE_RECOVERY_PHRASE'})"
      @back="send({type: 'BACK_TO_START'})"
    />

    <StepSavePhrase v-if="snapshot.matches('saveRecoveryPhrase')" @submit="send({type: 'END'})" @skip="send({type: 'END'})" />

    <div v-if="snapshot.matches('end')">
      <p>Process completed. Welcome!</p>
    </div>
  </div>
</template>
