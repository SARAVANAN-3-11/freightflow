# AWS deployment

Deploy the three containers as separate ECS Fargate services or as one ECS task:

- Frontend: build from the repository root with `--build-arg VITE_API_URL=https://api.example.com`, then expose container port `80` through an Application Load Balancer.
- API: build from `server/`, expose `4001`, and set the variables from `.env` as ECS task secrets. Never bake `.env` into an image.
- Optimizer: build from `engine/`, expose `5000` only to the API security group. Set `OPTIMIZER_URL=http://engine:5000` in the API task.

Use Amazon ECR for images, ECS Fargate for runtime, Secrets Manager for Supabase/Gemini keys, and CloudWatch for logs. Set `CLIENT_ORIGIN` to the deployed frontend origin and configure the ALB health checks to `/health` for the API and optimizer.

For a quick demo, build and push each image to ECR, create an ECS cluster, add the three task definitions, then place the frontend and API behind the ALB. Build the frontend with `--build-arg VITE_API_URL=https://api.example.com`; do not use `localhost` in an AWS build. Set `CLIENT_ORIGIN=https://app.example.com` on the API task. The hardware simulator page or device should send RFID requests to the public API URL and GPS requests to `POST /api/telemetry`.

The optimizer is internal-only. Use ECS Service Connect/Cloud Map so the API can resolve `engine:5000`, or run the API and optimizer in one ECS task and set `OPTIMIZER_URL=http://127.0.0.1:5000`. Allow port `4001` from the ALB security group to the API task, and port `5000` only from the API task security group to the optimizer.