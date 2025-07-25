export const handleSuccess = (
  stream: MediaStream,
  sampleRate: number,
  webSocket: WebSocket,
  bufferSize: number,
  onSetNewProcessor: (processor: AudioWorkletNode) => void,
  onSetNewSource: (source: MediaStreamAudioSourceNode) => void,
  onSetNewContext: (context: AudioContext) => void,
  onStop: () => void
) => {
  const context = new AudioContext({ sampleRate })
  context.audioWorklet
    .addModule('worklet/data-conversion-processor.js')
    .then(function () {
      const processor = new AudioWorkletNode(
        context,
        'data-conversion-processor',
        {
          channelCount: 5,
          numberOfInputs: 1,
          numberOfOutputs: 1,
          processorOptions: {
            bufferSize,
          },
        }
      )
      onSetNewProcessor(processor)

      const source = context.createMediaStreamSource(stream)

      source.connect(processor)
      processor.connect(context.destination)

      onSetNewSource(source)
      processor.port.onmessage = event => {
        if (webSocket.readyState === webSocket.OPEN) {
          webSocket.send(event.data)
        } else if (webSocket.readyState === webSocket.CLOSED) {
          processor.port.close()
          onStop()
        }
      }
      processor.port.start()
    })

  onSetNewContext(context)
}
