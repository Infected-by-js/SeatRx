import {onUnmounted, ref} from "vue"
import {Subject, Subscription} from "rxjs"
import {wsClient} from "@/modules/ws"

import type {ConnectionState} from "@/modules/ws"
import type {MessageType, RequestMessage, ResponseMessage} from "@/modules/ws/types"

type SubscriptionOptions = {
  immediate?: boolean
  retryOnReconnect?: boolean
  once?: boolean
}

type Handler<T> = (data: T) => void
type HandlerWithPrevState<T> = (data: T, prevState: ConnectionState | null) => void
type Unsubscribe = () => void

export function useSubscription<T>(type: MessageType, options: SubscriptionOptions = {}) {
  const subscriptions = new Set<Subscription>()
  const isSubscribed = ref(false)

  const snapshot$ = new Subject<ResponseMessage<T>>()
  const update$ = new Subject<ResponseMessage<T>>()
  const error$ = new Subject<string>()
  const success$ = new Subject<ResponseMessage<T>>()

  function subscribe() {
    unsubscribe()
    if (isSubscribed.value) return

    const sub = wsClient.on(type).subscribe({
      next: (message) => {
        if (message.status === "snapshot") snapshot$.next(message)
        else if (message.status === "success") success$.next(message)
        else if (message.status === "update") update$.next(message)
        else if (message.status === "error") error$.next(message.error)

        isSubscribed.value = true

        if (options.once) unsubscribe()
      },
    })

    subscriptions.add(sub)
  }

  function unsubscribe() {
    subscriptions.forEach((sub) => sub.unsubscribe())
    subscriptions.clear()
  }

  function resubscribe() {
    isSubscribed.value = false
    subscribe()
  }

  function send(message: Omit<RequestMessage<T>, "type">) {
    wsClient.send({...message, type})
  }

  function addSubscription<S>(subject: Subject<S>, handler: Handler<S>): Unsubscribe {
    const subscription = subject.subscribe(handler)
    subscriptions.add(subscription)
    return () => subscription.unsubscribe()
  }

  function onStateChange(handler: HandlerWithPrevState<ConnectionState>): Unsubscribe {
    const subscription = wsClient.connectionState.subscribe(({state, prevState}) => handler(state, prevState))
    subscriptions.add(subscription)
    return () => subscription.unsubscribe()
  }

  if (options.immediate) subscribe()

  if (options.retryOnReconnect) {
    const reconnectSub = wsClient.connectionState.subscribe(({state}) => {
      if (state === "connected") subscribe()
    })

    subscriptions.add(reconnectSub)
  }

  onUnmounted(() => {
    unsubscribe()
    snapshot$.complete()
    update$.complete()
    error$.complete()
    success$.complete()
  })

  return {
    onSnapshot: (handler: Handler<ResponseMessage<T>>) => addSubscription(snapshot$, handler),
    onUpdate: (handler: Handler<ResponseMessage<T>>) => addSubscription(update$, handler),
    onError: (handler: Handler<string>) => addSubscription(error$, handler),
    onSuccess: (handler: Handler<ResponseMessage<T>>) => addSubscription(success$, handler),
    onStateChange,
    send,
    resubscribe,
  }
}