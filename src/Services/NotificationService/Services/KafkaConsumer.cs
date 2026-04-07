using Confluent.Kafka;

namespace NotificationService.Services
{
    public class KafkaConsumer
    {
        public void Start()
        {
            var config = new ConsumerConfig
            {
                BootstrapServers = "localhost:9092",
                GroupId = "notification-group",
                AutoOffsetReset = AutoOffsetReset.Earliest
            };

            var consumer = new ConsumerBuilder<Ignore, string>(config).Build();
            consumer.Subscribe("order-events");

            while (true)
            {
                var result = consumer.Consume();

                Console.WriteLine($"Received: {result.Message.Value}");

                // Notification logic
            }
        }
    }
}
